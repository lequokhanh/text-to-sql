from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Event,
    Context,
)
from core.utils import (
    extract_table_list,
    extract_tables_from_sql,
    schema_parser,
    show_prompt,
    log_prompt,
    extract_sql_query
)
from core.templates import (
    TABLE_EXTRACTION_TMPL,
    SQL_ERROR_REFLECTION_TMPL
)
from exceptions.app_exception import AppException
from enums.response_enum import ResponseEnum
from core.services import execute_sql
from llama_index.core import PromptTemplate
from llama_index.llms.ollama import Ollama
import re
import logging
import json
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class TableRetrieveEvent(Event):
    """Result of running table retrieval."""

    table_names: list[str]
    query: str

class TextToSQLEvent(Event):
    """Text-to-SQL event."""
    relevant_tables: list[str]
    query: str

class SQLValidatorEvent(Event):
    """Execute SQL event."""
    sql_query: str
    retry_count: int = 0

class ExecuteSQLEvent(Event):
    """Execute SQL event."""
    sql_query: str

class SQLReflectionEvent(Event):
    """Execute SQL event."""
    sql_query: str
    error: str
    retry_count: int = 0


class SQLAgentWorkflow(Workflow):
    """SQLAgent Workflow."""

    def __init__(
        self,
        text2sql_prompt: PromptTemplate,
        table_retrieval_prompt: PromptTemplate,
        llm: Ollama,
        *args, **kwargs
    ) -> None:
        """Initialize the SQLAgent Workflow."""
        super().__init__(*args, **kwargs)
        self.text2sql_prompt = text2sql_prompt
        self.table_retrieval_prompt = table_retrieval_prompt
        self.num_tables_threshold = 3
        self.max_sql_retries = 3
        self.llm = llm
        self._timeout = 30.0

    @step
    async def Start_workflow(self, context: Context, ev: StartEvent) -> TableRetrieveEvent | TextToSQLEvent:
        """Start the SQLAgent Workflow."""
        logger.info("\033[93m[START] Beginning SQL Agent workflow\033[0m")
        start_time = datetime.now()
        await context.set("table_details", ev.table_details)
        await context.set("connection_payload", ev.connection_payload)
        await context.set("user_query", ev.query)

        logger.info(f"\033[93m[START] User query: \"{ev.query}\"\033[0m")
        logger.info(f"\033[93m[START] Connection type: {ev.connection_payload.get('dbType', 'unknown')}\033[0m")

        table_details = ev.table_details        
        table_names = [table["tableIdentifier"] for table in table_details]
        
        logger.info(f"\033[93m[START] Total tables available: {len(table_names)}\033[0m")

        if len(table_names) > self.num_tables_threshold:
            logger.info(
                f"\033[93m[START] Exceeds threshold of {self.num_tables_threshold} tables. Will use table retrieval step.\033[0m")
            logger.info("\033[94m[START] All tables: " + json.dumps(table_names) + "\033[0m")
            
            end_time = datetime.now()
            logger.info(f"\033[93m[START] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
            return TableRetrieveEvent(table_names=table_names, query=ev.query)
        else:
            logger.info(f"\033[93m[START] Under threshold ({len(table_names)} <= {self.num_tables_threshold}). Using all tables.\033[0m")
            logger.info("\033[94m[START] Using tables: " + json.dumps(table_names) + "\033[0m")
            
            # Set relevant_tables here for the direct path
            await context.set("relevant_tables", table_names)
            
            end_time = datetime.now()
            logger.info(f"\033[93m[START] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
            return TextToSQLEvent(relevant_tables=table_names, query=ev.query)

    @step
    async def Retrieve_relevant_tables(self, context: Context, ev: TableRetrieveEvent) -> TextToSQLEvent:
        """Retrieve table context."""
        logger.info("\033[93m[RETRIEVE] Starting table relevance filtering\033[0m")
        start_time = datetime.now()
        
        logger.info(f"\033[93m[RETRIEVE] Query: \"{ev.query}\"\033[0m")
        logger.info(f"\033[93m[RETRIEVE] Available tables: {len(ev.table_names)}\033[0m")
        
        fmt_messages = self.table_retrieval_prompt.format_messages(
            query_str=ev.query,
            table_names="\n".join(ev.table_names)
        )
        
        # Log the prompt
        log_prompt(fmt_messages, "RETRIEVE")
        
        
        logger.info("\033[93m[RETRIEVE] Querying LLM for relevant tables...\033[0m")
        llm_start_time = datetime.now()
        chat_response = self.llm.chat(fmt_messages)
        llm_end_time = datetime.now()
        
        logger.info(f"\033[93m[RETRIEVE] LLM response time: {(llm_end_time - llm_start_time).total_seconds():.2f} seconds\033[0m")
        logger.info("\033[94m[RETRIEVE] LLM response: " + str(chat_response) + "\033[0m")
        
        relevant_tables = extract_table_list(chat_response)
        logger.info(f"\033[93m[RETRIEVE] Extracted {len(relevant_tables)} relevant tables\033[0m")
        logger.info("\033[94m[RETRIEVE] Relevant tables: " + json.dumps(relevant_tables) + "\033[0m")
        
        await context.set("relevant_tables", relevant_tables)
        
        end_time = datetime.now()
        logger.info(f"\033[93m[RETRIEVE] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
        return TextToSQLEvent(relevant_tables=relevant_tables, query=ev.query)

    @step
    async def Generate_sql(self, context: Context, ev: TextToSQLEvent) -> SQLValidatorEvent:
        """Generate SQL based on the user query and table schema."""
        logger.info("\033[93m[GENERATE] Starting SQL generation\033[0m")
        start_time = datetime.now()
        
        logger.info(f"\033[93m[GENERATE] Query: \"{ev.query}\"\033[0m")
        logger.info(f"\033[93m[GENERATE] Using tables: {json.dumps(ev.relevant_tables)}\033[0m")
        
        table_details = await context.get("table_details")
        connection_payload = await context.get("connection_payload")
        dialect = connection_payload.get("dbType", "").upper()
        logger.info(f"\033[93m[GENERATE] DB dialect: {dialect}\033[0m")
        
        selected_tables = []
        for table_name in ev.relevant_tables:
            for table in table_details:
                if table_name.lower().strip() == table["tableIdentifier"].lower().strip():
                    selected_tables.append(table)
        
        logger.info(f"\033[93m[GENERATE] Preparing schema information for {len(selected_tables)} tables\033[0m")
        table_schemas = schema_parser(selected_tables, "DDL")
        
        fmt_messages = self.text2sql_prompt.format_messages(
            user_question=ev.query,
            table_schemas=table_schemas,
            dialect=dialect
        )
    
        # Log the prompt
        log_prompt(fmt_messages, "GENERATE")
        
        logger.info("\033[93m[GENERATE] Querying LLM for SQL generation...\033[0m")
        llm_start_time = datetime.now()
        chat_response = self.llm.chat(fmt_messages)
        llm_end_time = datetime.now()
        
        logger.info(f"\033[93m[GENERATE] LLM response time: {(llm_end_time - llm_start_time).total_seconds():.2f} seconds\033[0m")
        logger.info("\033[94m[GENERATE] LLM response: " + str(chat_response) + "\033[0m")
        
        # Extract the SQL query from the response
        sql_query = extract_sql_query(chat_response.message.content)
        logger.info("\033[92m[GENERATE] Extracted SQL query: " + sql_query + "\033[0m")
        
        end_time = datetime.now()
        logger.info(f"\033[93m[GENERATE] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
        return SQLValidatorEvent(sql_query=sql_query, retry_count=0)
    
    @step
    async def Validate_SQL(self, context: Context, ev: SQLValidatorEvent) -> ExecuteSQLEvent:
        """Validate SQL query."""
        logger.info("\033[93m[VALIDATE] Starting SQL validation\033[0m")
        start_time = datetime.now()
        
        sql_query = ev.sql_query
        logger.info(f"\033[93m[VALIDATE] SQL to validate: {sql_query}\033[0m")
        
        table_details = await context.get("table_details")
        
        # Extract tables from the SQL query
        logger.info("\033[93m[VALIDATE] Extracting tables from SQL query\033[0m")
        table_sql = extract_tables_from_sql(sql_query)
        logger.info("\033[94m[VALIDATE] Tables found in SQL: " + json.dumps(table_sql) + "\033[0m")
        
        # Get all valid table identifiers
        valid_tables = [table["tableIdentifier"].lower().strip() for table in table_details]
        logger.info("\033[94m[VALIDATE] Valid tables: " + json.dumps(valid_tables) + "\033[0m")

        # Check if all the tables in the SQL are in the table_details
        valid = True
        for table in table_sql:
            if table.lower().strip() not in valid_tables:
                logger.error(f"\033[91m[VALIDATE] Invalid table found: '{table}'\033[0m")
                valid = False
                break
        
        if not valid:
            logger.error("\033[91m[VALIDATE] SQL references tables not in provided schema\033[0m")
            raise AppException(ResponseEnum.NOT_RELEVANT_QUERY)
        
        logger.info("\033[92m[VALIDATE] SQL query validated successfully\033[0m")
        
        end_time = datetime.now()
        logger.info(f"\033[93m[VALIDATE] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
        return ExecuteSQLEvent(sql_query=sql_query)

    @step
    async def Excute_SQL(self, context: Context, ev: ExecuteSQLEvent) -> SQLReflectionEvent | StopEvent:
        """ Execute SQL query."""
        logger.info("\033[93m[EXECUTE] Starting SQL execution\033[0m")
        start_time = datetime.now()
        
        sql_query = ev.sql_query
        logger.info(f"\033[93m[EXECUTE] Executing SQL: {sql_query}\033[0m")
        
        connection_payload = await context.get("connection_payload")
        logger.info(f"\033[93m[EXECUTE] Using connection type: {connection_payload.get('dbType', 'unknown')}\033[0m")
        
        logger.info("\033[93m[EXECUTE] Sending query to database...\033[0m")
        exec_start_time = datetime.now()
        payload = execute_sql(connection_payload, sql_query)
        exec_end_time = datetime.now()
        
        logger.info(f"\033[93m[EXECUTE] Database query time: {(exec_end_time - exec_start_time).total_seconds():.2f} seconds\033[0m")
        
        if payload.get("error"):
            error_msg = payload["error"]
            logger.error(f"\033[91m[EXECUTE] SQL execution failed with error: {error_msg}\033[0m")
            
            # Initialize the retry count for a new error
            end_time = datetime.now()
            logger.info(f"\033[93m[EXECUTE] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
            return SQLReflectionEvent(sql_query=sql_query, error=error_msg, retry_count=0)
        else:
            logger.info("\033[92m[EXECUTE] SQL executed successfully\033[0m")
            
            # Log result summary (count of rows, etc.)
            if "data" in payload and isinstance(payload["data"], list):
                logger.info(f"\033[93m[EXECUTE] Query returned {len(payload['data'])} rows\033[0m")
            
            end_time = datetime.now()
            logger.info(f"\033[93m[EXECUTE] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
            return StopEvent(result=sql_query)
    
    @step
    async def Reflect_SQL(self, context: Context, ev: SQLReflectionEvent) -> SQLValidatorEvent | StopEvent:
        """Reflect on the SQL query with retry limit."""
        logger.info("\033[93m[REFLECT] Starting SQL reflection\033[0m")
        start_time = datetime.now()
        
        # Check retry count
        if ev.retry_count >= self.max_sql_retries:
            logger.error(f"\033[91m[REFLECT] Reached maximum retry attempts ({self.max_sql_retries}). Stopping workflow.\033[0m")
            error_msg = f"Failed to fix SQL query after {self.max_sql_retries} attempts. Last error: {ev.error}"
            logger.error(f"\033[91m[REFLECT] {error_msg}\033[0m")
            
            end_time = datetime.now()
            logger.info(f"\033[93m[REFLECT] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
            raise AppException(error_msg, 4)
        
        # Increment retry count
        retry_count = ev.retry_count + 1
        logger.info(f"\033[93m[REFLECT] Attempt {retry_count}/{self.max_sql_retries}\033[0m")
        
        sql_query = ev.sql_query
        error = ev.error
        logger.info(f"\033[93m[REFLECT] SQL with error: {sql_query}\033[0m")
        logger.info(f"\033[91m[REFLECT] Error message: {error}\033[0m")
        
        connection_payload = await context.get("connection_payload")
        user_query = await context.get("user_query")
        table_details = await context.get("table_details")
        
        # Safely get relevant tables
        try:
            relevant_tables = await context.get("relevant_tables")
            logger.info(f"\033[93m[REFLECT] Using cached relevant tables: {json.dumps(relevant_tables)}\033[0m")
        except ValueError:
            # Use all tables if relevant_tables wasn't set
            relevant_tables = [table["tableIdentifier"] for table in table_details]
            logger.info(f"\033[93m[REFLECT] No cached relevant tables. Using all tables: {json.dumps(relevant_tables)}\033[0m")

        # Prepare selected tables
        selected_tables = []
        for table_name in relevant_tables:
            for table in table_details:
                if table_name.lower().strip() == table["tableIdentifier"].lower().strip():
                    selected_tables.append(table)
        
        logger.info(f"\033[93m[REFLECT] Preparing schema information for {len(selected_tables)} tables\033[0m")
        table_schemas = schema_parser(selected_tables, "DDL")
        
        fmt_messages = SQL_ERROR_REFLECTION_TMPL.format_messages(
            database_schema=table_schemas,
            sql_query=sql_query,
            error_message=error,
            dialect=connection_payload.get("dbType", "").upper(),
            user_query=user_query
        )
        
        # Log the prompt
        log_prompt(fmt_messages, "REFLECT")
        
        logger.info("\033[93m[REFLECT] Querying LLM for SQL correction...\033[0m")
        llm_start_time = datetime.now()
        chat_response = self.llm.chat(fmt_messages)
        llm_end_time = datetime.now()
        
        logger.info(f"\033[93m[REFLECT] LLM response time: {(llm_end_time - llm_start_time).total_seconds():.2f} seconds\033[0m")
        logger.info("\033[94m[REFLECT] LLM response: " + str(chat_response) + "\033[0m")
        
        # Extract the corrected SQL query from the response
        corrected_sql_query = extract_sql_query(chat_response.message.content)
        
        if corrected_sql_query == sql_query:
            logger.warning("\033[93m[REFLECT] LLM returned the same SQL query. No changes made.\033[0m")
        else:
            logger.info("\033[92m[REFLECT] SQL query was modified by LLM\033[0m")
        
        logger.info("\033[92m[REFLECT] Corrected SQL query: " + corrected_sql_query + "\033[0m")
        
        end_time = datetime.now()
        logger.info(f"\033[93m[REFLECT] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
        return SQLValidatorEvent(sql_query=corrected_sql_query, retry_count=retry_count)