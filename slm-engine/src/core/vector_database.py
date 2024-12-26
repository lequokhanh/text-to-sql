from t2sqlcore.PostgresDB import PostgresDB
from llama_index.core.settings import Settings
from pyvi.ViTokenizer import tokenize
import weaviate
from weaviate.schema import FieldSchema
import numpy as np
import os
import logging
import warnings

# Disable only FutureWarning
warnings.simplefilter(action="ignore", category=FutureWarning)
logger = logging.getLogger(__name__)


class Weaviate:
    def __init__(self, sql_database: PostgresDB = None, **kwargs):
        self.instance = sql_database.instance
        self.sql_database = sql_database
        self.force_make = kwargs.get("force_make", False)
        self._connect_to_vectordb()

    def _connect_to_vectordb(self):
        client = weaviate.connect_to_local(
            host="127.0.0.1",  # Use a string to specify the host
            port=8081,
            grpc_port=50051,
        )
        logger.info(
            f"Connected to Weaviate Vector Database successfully! {client.is_ready()}")

    def sync(self, behavior="all"):
        """Sync the database with the vector database"""
        # Not synced & all: all
        # Sync the new tables only: update
        # Sync the existing tables: reindex
        if self._check_database_synced() and behavior != "reindex":
            logger.info(f"Database '{self.instance}' already synced.")
            return

        if behavior == "all" or behavior == "reindex":
            logger.info(
                f"Syncing all tables: \033[94m{self.sql_database.get_all_tables()}\033[0m")
            for table in self.sql_database.get_all_tables():
                if table in self.client.schema.classes:
                    logger.info(
                        f"Table {table} already indexed. Dropped & Reindexing...")
                    self.client.schema.delete_class(table)
                self._index_table(table)

    def _check_database_synced(self):
        all_synced = True
        indexed_tables = []
        for table in self.sql_database.get_all_tables():
            if table not in self.client.schema.classes:
                logger.info(f"Table {table} not indexed.")
                all_synced = False
            else:
                logger.info(f"Table {table} already indexed.")
                indexed_tables.append(table)

    def _index_table(self, table_name):
        logger.info(f"Indexing table: \033[94m{table_name}\033[0m")
        fields = [
            # Use auto generated id as primary key
            FieldSchema(
                name="node_id",
                dtype=DataType.VARCHAR,
                is_primary=True,
                auto_id=True,
                max_length=100,
            ),
            FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=1000),
            FieldSchema(name="tokenized_text",
                        dtype=DataType.VARCHAR, max_length=1000),
            FieldSchema(name="sparse_vector",
                        dtype=DataType.SPARSE_FLOAT_VECTOR),
            FieldSchema(
                name="dense_vector",
                dtype=DataType.FLOAT_VECTOR,
                dim=len(
                    self.dense_embedding_func.get_text_embedding_batch(["embed"])[
                        0]
                ),
            ),
        ]

        schema = CollectionSchema(fields)
        collection_name = table_name
        table_collection = Collection(
            collection_name, schema, consistency_level="Strong"
        )
        sparse_index = {
            "index_type": "SPARSE_INVERTED_INDEX", "metric_type": "IP"}
        table_collection.create_index("sparse_vector", sparse_index)
        dense_index = {"index_type": "AUTOINDEX", "metric_type": "IP"}
        table_collection.create_index("dense_vector", dense_index)
        if utility.has_collection(collection_name):
            table_collection.load()
            logger.info(
                f"Collection '{collection_name}' created successfully.")
            logger.info("Indexing...")
        rows = self.sql_database.get_data(table_name)
        row_tups = []
        for row in rows:
            row_dict = {
                "text": row,
                "tokenized_text": tokenize(str(row)),
            }
            row_tups.append(row_dict)

        if row_tups:
            tokenize_batches = [str(row["tokenized_text"]) for row in row_tups]
            org_text_batches = [str(row["text"]) for row in row_tups]

            docs_dense_embeddings = self.dense_embedding_func.get_text_embedding_batch(
                tokenize_batches
            )
            logger.info(
                f"Dense embeddings shape: {len(docs_dense_embeddings)} {len(docs_dense_embeddings[0])}"
            )
            docs_sparse_embeddings = self.sparse_embedding_func(
                tokenize_batches)
            logger.info(
                f"Sparse embeddings shape: {docs_sparse_embeddings.shape[0]}")
            batch_size = 50
            for i in range(0, len(row_tups), batch_size):
                batched_entities = [
                    org_text_batches[i: i + batch_size],
                    tokenize_batches[i: i + batch_size],
                    docs_sparse_embeddings[i: i + batch_size],
                    docs_dense_embeddings[i: i + batch_size],
                ]
                print("Inserting batch", i)
                table_collection.insert(batched_entities)
            logger.info(
                f"'{collection_name}' - Number of entities inserted: {table_collection.num_entities}"
            )
