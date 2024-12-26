    import os

    from dotenv import load_dotenv
    from t2sqlcore._templates import TEXT_TO_SQL_TMPL, SEMANTIC_ROWS_TMPL
    from t2sqlcore.VectorDB import MilvusVectorDatabase
    from t2sqlcore.PostgresDB import PostgresDB
    from llama_index.core.retrievers import SQLRetriever
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    load_dotenv()

    INSTANCES_PATH = os.path.abspath(os.getenv("INSTANCES_DIR"))


    class Instance:
        def __init__(
            self,
            instance_name: str,
            use_vector_db: bool = True,
            create_if_new: bool = False,
        ):
            self.name = instance_name
            self.base_dir = os.path.join(INSTANCES_PATH, str(self.name))
            self.database = PostgresDB(
                instance=self.name, force_make=create_if_new)
            self.vector_database = (
                MilvusVectorDatabase(sql_database=self.database,
                                    force_make=create_if_new)
                if use_vector_db
                else None
            )
            self.ready = self._check_instance()

        def sql_retriever(self):
            """Initialize SQL Retriever."""
            return SQLRetriever(self.database.sql_wrapper())

        def sync_vector_db(self, behavior="all"):
            """Sync the instance."""
            if self._check_instance():
                self.vector_database.sync(behavior=behavior)
            else:
                logger.warning("Instance not ready. Cannot sync.")

        def vector_search(self, on_table: str, query: str):  # use hybrid search as default
            """Search the instance."""
            return self.vector_database.hybrid_search(
                table_name=on_table, query=query, limit=3
            )["rerank_results"]

        def get_semantic_similarity_rows(self, query: str):
            """Get the semantic similarity rows."""
            insert_statement = []
            for table_name in self.database.get_all_tables():
                rows = "\n".join(
                    [
                        res["text"]
                        for res in self.vector_search(on_table=table_name, query=query)
                    ]
                )
                columns = ", ".join(self.database.get_table_columns(table_name))
                table_insert_str = SEMANTIC_ROWS_TMPL.format(
                    table_name=table_name, columns=columns, values=rows
                )
                insert_statement.append(table_insert_str)
            return "\n".join(insert_statement)

        def get_context_prompt(self, question: str, instructions=""):
            """Get the context string. for LLM Text2SQL."""
            create_table_statements, foreign_key_statements = self.database.get_all_ddls()
            insert_statements = self.get_semantic_similarity_rows(query=question)

            prompt = TEXT_TO_SQL_TMPL.format(
                question=question,
                instructions=instructions,
                create_table_statements=create_table_statements,
                insert_statements=insert_statements,
                foreign_key_statements=foreign_key_statements,
            )

            components = {
                "table_statements": create_table_statements,
                "insert_statements": insert_statements,
                "foreign_key_statements": foreign_key_statements,
            }

            return prompt, components

        def _check_instance(self):
            """Check if the instance exists."""
            # Check synced status
            database_status = self.database.check_ready()
            if self.vector_database:
                synced_status = self.vector_database._check_database_synced()
                if not synced_status:
                    logger.warning(f"Vector database '{self.name}' not synced.")
            if not database_status:
                logger.warning(
                    f"Database '{self.name}' not ready. Add at least one table.")
                return False
            return True
