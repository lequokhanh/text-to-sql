import os
import logging
import datetime
from decimal import Decimal
import pandas as pd
from sqlalchemy import (
    create_engine,
    text,
    MetaData,
    Table,
    Column
)
# Datatype
from sqlalchemy import (
    ForeignKeyConstraint
)
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from sqlalchemy.engine import URL
from sqlalchemy_utils import database_exists, create_database
from unidecode import unidecode
from llama_index.core import SQLDatabase
import core.utils as utils


logger = logging.getLogger(__name__)
load_dotenv()
# INSTANCES_PATH = os.path.abspath(os.getenv("INSTANCES_DIR"))


class PostgresDB:
    def __init__(self, instance: str = None, **kwargs):
        """Initialize PostgreSQL Database connection."""
        self.instance = instance or "default"
        self.dialect = "postgresql"
        self.force_make = kwargs.get("force_make", False)
        self.metadata = MetaData(schema=self.instance)
        self.deferred_foreign_keys = []

    @property
    def sql_wrapper(self):
        """Wrap SQL Database"""
        if self._check_connection(self._engine):
            return SQLDatabase(self._engine)
        return None

    @property
    def _engine(self):
        if self.instance:
            url = URL.create(
                "postgresql+psycopg2",
                username=os.getenv("POSTGRES_USER", "postgres"),
                password=os.getenv("POSTGRES_PASSWORD", "postgres"),
                host=os.getenv("POSTGRES_HOST", "localhost"),
                database=self.instance,
            )
            engine = create_engine(url)
            return engine
        return None

    def _check_connection(self, engine):
        """Check if the connection to the database is successful."""
        try:
            with engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                if result.scalar() == 1:
                    logger.info(
                        f"\n\033[92m[PostgresDB]: \033[0m\n"
                        f"Connected to database instance '{self.instance}' successfully!\n"
                    )
                    return True
        except Exception as e:
            logger.error(
                f"Failed to connect to database '{self.instance}'. {e}")
            return False

    def initialize(self):
        if self._check_connection(self._engine):
            return
        else:
            create_database(self._engine.url)

        return database_exists(self._engine.url)

    def migrate_from_sqlite(self, path: str):
        """Migrate from SQLite to PostgreSQL."""
        sqlite_engine = create_engine(f"sqlite:///{path}")

        # Load SQL query from file
        with open("./core/sql/sqlite_tables.sql", "r") as file:
            sql_query = file.read()

        # Execute SQL query
        with sqlite_engine.connect() as connection:
            df_tables = pd.read_sql_query(text(sql_query), connection)
        # TODO: add comment from user
        df_tables["comment"] = "this is examples"
        print(df_tables)
        for table in df_tables["table_name"].unique():
            metadata = df_tables[df_tables["table_name"]
                                 == table].to_dict(orient='records')
            self.create_table(table_name=table, metadata=metadata)

            break

        # print(df_tables)

    def generate_table_post_meta(self, table_name: str, columns_metadata: list):
        """Generate a SQLAlchemy Table object and capture deferred foreign key information."""
        post_meta = MetaData()
        column_packages, defer_fks = [], []

        for col in columns_metadata:
            column = Column(
                col['column_name'],
                utils.dialect_dtype_mapping(
                    dialect="sqlite", sql_type=col['data_type']),
                primary_key=col['is_primary_key'],
                autoincrement=col['is_primary_key'] if col['column_name'] == "id" else False,
                comment=col['comment'],
            )
            column_packages.append(column)

            if col.get('is_foreign_key', False):
                defer_fks.append({
                    "table_name": table_name,
                    "column_name": col['column_name'],
                    "relation_table": col['relation_table'],
                    "relation_column": col['relation_column'],
                })

        Table(table_name, post_meta, *column_packages, extend_existing=True)

        return post_meta, defer_fks

    def create_table(
        self,
        table_name: str,
        metadata: dict,
        replace_if_exists=False,
    ):
        """Create a table and optionally defer foreign key constraints."""
        table_post_meta, defer_fks = self.generate_table_post_meta(
            table_name=table_name, columns_metadata=metadata)

        # Create table
        table_post_meta.create_all(self._engine)
        logger.info(f"Table '{table_name}' created.")

        # apply deferred foreign keys
        self.create_relationship(defer_fks)
        logger.info("Deferred foreign keys applied.")

    def create_relationship(self, deferred_fks: list):
        metadata = MetaData(bind=self._engine)
        metadata.reflect()

        for fk in deferred_fks:
            table_name = fk["table_name"]
            relation_table = fk["relation_table"]
            column_name = fk["column_name"]
            relation_column = fk["relation_column"]

            # Validate existence of both tables
            if table_name in metadata.tables and relation_table in metadata.tables:
                table = metadata.tables[table_name]
                relation_table_obj = metadata.tables[relation_table]

                # Define and attach the foreign key constraint
                fk_constraint = ForeignKeyConstraint(
                    [table.c[column_name]],
                    [relation_table_obj.c[relation_column]],
                    ondelete="CASCADE",
                    onupdate="CASCADE",
                )
                table.append_constraint(fk_constraint)
                table.create(bind=self._engine, checkfirst=True)

                logger.info(
                    f"Foreign key added: {table_name}.{column_name} -> {relation_table}.{relation_column}")
            else:
                logger.error(
                    f"Cannot create relationship: {table_name} or {relation_table} does not exist.")

        logger.info("All foreign keys have been applied.")

    def insert_data(self, dataframe, table_name, columns_metadata):
        """Insert data from a dataframe into the specified table."""
        column_map = {}
        dataframe = dataframe.copy()
        for col in columns_metadata["columns"]:
            if col[1] == "date":
                dataframe.loc[:, col[0]] = pd.to_datetime(
                    dataframe[col[0]], format="%d/%m/%Y", errors="coerce"
                )
            column_map[col[0]] = self._column_name_normalizer(col[0])
        logging.info(
            f"Insert to Table '{table_name} with Column mapping: {column_map}")
        dataframe = dataframe.rename(columns=column_map)
        dataframe = dataframe.loc[:, column_map.values()]

        with self.engine.connect() as connection:
            for chunk in dataframe.to_dict(orient="records"):
                columns = ", ".join([f'"{key}"' for key in chunk.keys()])
                values = ", ".join([f":{key}" for key in chunk.keys()])

                query = f"INSERT INTO {table_name} ({columns}) VALUES ({values})"
                connection.execute(text(query), chunk)
                connection.commit()
        logger.info(f"Table '{table_name}' data inserted successfully.")

    def get_ddl(self, table_name):
        """Get the DDL for a table in the PostgreSQL schema, with primary key and foreign key comments."""
        ddl_str = f"CREATE TABLE {table_name} (\n   "
        fk_comment_str = ""

        with self.engine.connect() as connection:
            # Retrieve column definitions and primary key information
            column_result = connection.execute(
                text(
                    f"""
                    SELECT 
                        a.attname AS column_name,
                        t.typname AS data_type,
                        d.description AS column_comment,
                        CASE WHEN EXISTS (
                            SELECT 1
                            FROM pg_constraint pk
                            JOIN pg_attribute att ON att.attnum = ANY(pk.conkey) AND att.attrelid = pk.conrelid
                            WHERE pk.contype = 'p' AND pk.conrelid = c.oid AND att.attname = a.attname
                        ) THEN true ELSE false END AS is_primary_key,
                        CASE WHEN EXISTS (
                            SELECT 1
                            FROM pg_constraint fk
                            JOIN pg_attribute att ON att.attnum = ANY(fk.conkey) AND att.attrelid = fk.conrelid
                            WHERE fk.contype = 'f' AND fk.conrelid = c.oid AND att.attname = a.attname
                        ) THEN (
                            SELECT confrelid::regclass::text || '.' || 
                                string_agg(att2.attname, ', ')
                            FROM pg_constraint fk
                            JOIN pg_attribute att2 ON att2.attrelid = fk.confrelid AND att2.attnum = ANY(fk.confkey)
                            WHERE fk.contype = 'f' AND fk.conrelid = c.oid AND a.attnum = ANY(fk.conkey)
                            GROUP BY confrelid::regclass::text  -- Group by confrelid::regclass::text
                        ) ELSE NULL END AS foreign_key_reference
                    FROM 
                        pg_class c
                        JOIN pg_attribute a ON a.attrelid = c.oid
                        LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = a.attnum
                        JOIN pg_namespace n ON c.relnamespace = n.oid
                        JOIN pg_type t ON a.atttypid = t.oid
                    WHERE 
                        n.nspname = 'public'
                        AND c.relname = '{table_name.lower()}'
                        AND a.attnum > 0;
                    """
                )
            ).fetchall()

        # Retrieve ddl and fk_comment strings
        if column_result:
            for row in column_result:
                if row[3]:  # is_primary_key
                    ddl_str += f"{row[0]} {row[1]} PRIMARY KEY, --'{row[2]}'\n   "
                else:
                    ddl_str += f"{row[0]} {row[1]}, --'{row[2]}'\n   "
                if row[4]:
                    fk_comment_str += (
                        f"-- {table_name}.{row[0]} can be joined with {row[4]}\n"
                    )
            ddl_str = ddl_str[:-4] + "\n);"

        return ddl_str, fk_comment_str

    def get_all_ddls(self):
        """Get the DDLs for all tables in the PostgreSQL schema."""
        ddl_str = ""
        fk_comment_str = ""
        tables = self.get_all_tables()
        for tab in tables:
            ddl, fk_comment = self.get_ddl(tab)
            ddl_str += f"{ddl}\n"
            fk_comment_str += f"{fk_comment}"

        return ddl_str, fk_comment_str

    def get_all_tables(self):
        """Get all tables in the PostgreSQL schema."""
        with self.engine.connect() as connection:
            table_result = connection.execute(
                text(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public';
                    """
                )
            ).fetchall()
        return [row[0] for row in table_result]

    def get_table_columns(self, table_name):
        """Get all columns in a table in the PostgreSQL schema."""
        with self.engine.connect() as conn:
            query = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = :table_name
            ORDER BY ordinal_position;
            """
            cursor = conn.execute(text(query), {"table_name": table_name})
            columns = [row[0] for row in cursor.fetchall()]
            return columns

    def get_sample_rows(self, table_name, n=5):
        """Get a sample of rows from a table in the PostgreSQL schema."""
        with self.engine.connect() as conn:
            query = f"SELECT * FROM {table_name} LIMIT {n};"
            cursor = conn.execute(text(query))
            rows = cursor.fetchall()

            return self._rows_retrieved_normalizer(rows)

    def get_table_metadata(self, table_name):
        """Get metadata for a table in the PostgreSQL schema."""
        columns = self.get_table_columns(table_name)
        sample_rows = self.get_sample_rows(table_name)
        metadata = {
            "columns": columns,
            "sample_rows": sample_rows,
        }
        return metadata

    def get_all_table_metadata(self):
        """Get metadata for all tables in the PostgreSQL schema."""
        tables = self.get_all_tables()
        metadata = {}
        for table in tables:
            metadata[table] = self.get_table_metadata(table)
        return metadata

    def get_data(self, table_name):
        """Get all data from a table in the PostgreSQL schema."""
        columns = " ,".join(self.get_table_columns(table_name))
        with self.engine.connect() as conn:
            query = f"SELECT DISTINCT {columns} FROM {table_name};"
            cursor = conn.execute(text(query))
            rows = cursor.fetchall()
            return self._rows_retrieved_normalizer(rows)

    def execute_sql_query(self, sql: str):
        """Retrieve data from the database using a query."""
        with self.engine.connect() as connection:
            try:
                # Execute the query
                result = connection.execute(text(sql))
                rows = result.fetchall()
                rows = self._rows_retrieved_normalizer(rows)
                columns = result.keys()._keys
                # Return success status and the data
                return {
                    "status": "success",
                    "result": {"columns": columns, "rows": rows},
                }

            except SQLAlchemyError as e:
                # Handle SQLAlchemy-related errors
                error_msg = str(e.__cause__ or e)
                return {"status": "failure", "result": error_msg}

    def _check_table_exists(self, table_name):
        """Check if a table exists in the schema."""
        with self.engine.connect() as connection:
            result = connection.execute(
                text(
                    f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table_name.lower()}');"
                )
            ).scalar()
        return result

    def _column_name_normalizer(self, column_name):
        return (
            unidecode(column_name)
            .replace(" ", "_")
            .replace("-", "_")
            .replace(".", "_")
            .lower()
        )

    def _value_normalizer(self, value):
        if isinstance(value, datetime.date):
            return value.strftime("%Y-%m-%d")

        if isinstance(value, Decimal):
            return float(value)

        return value

    def _rows_retrieved_normalizer(self, rows):
        formatted_rows = []
        for row in rows:
            formatted_row = []
            for value in row:
                formatted_row.append(self._value_normalizer(value))
            # Rebuild the row as a tuple
            formatted_rows.append(tuple(formatted_row))

        return formatted_rows

    def drop_table(self, table_name):
        """Drop a table from the schema."""
        with self.engine.connect() as connection:
            connection.execute(
                text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
            connection.commit()

        if self._check_table_exists(table_name):
            logger.info(f"Table '{table_name}' dropped unsuccessfully.")
            return False
        else:
            logger.info(
                f"Table '{table_name}' either does not exist or has been dropped."
            )
        return True

    def check_ready(self):
        """Check if the database is ready."""
        # At least one table should exist
        return len(self.get_all_tables()) > 0
