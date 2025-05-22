from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Context,
)
from core.utils import (
    extract_tables_from_sql,
    schema_parser,
    extract_sql_query,
)
from core.events import (
    TableRetrieveEvent,
    TextToSQLEvent,
    SQLValidatorEvent,
    ExecuteSQLEvent,
    SQLReflectionEvent,
)
from core.models import (
    ListOfRelevantTables,
    SQLQuery,
)
from core.services import execute_sql, llm_chat, llm_chat_with_pydantic, get_sample_data_improved   
from response.log_manager import (
    log_step_start,
    log_step_end,
    log_success,
    log_error,
    log_warning,
    log_llm_operation,
    log_prompt
)
from llama_index.core import PromptTemplate
from llama_index.llms.ollama import Ollama
from llama_index.llms.google_genai import GoogleGenAI
from exceptions.app_exception import AppException
from config.app_config import app_config
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SQLAgentWorkflow(Workflow):
    """SQLAgent Workflow for text-to-SQL conversion with table retrieval and error handling."""

    def __init__(
        self,
        text2sql_prompt: str,
        llm: Ollama | GoogleGenAI,
        *args, **kwargs
    ) -> None:
        """Initialize the SQLAgent Workflow."""
        super().__init__(*args, **kwargs)
        self.text2sql_prompt = text2sql_prompt
        self.num_tables_threshold = 3
        self.max_sql_retries = 3
        self.llm = llm
        self._timeout = 300.0

    @step
    async def Start_workflow(self, context: Context, ev: StartEvent) -> TableRetrieveEvent | TextToSQLEvent:
        """Start the SQLAgent Workflow."""
        start_time = log_step_start("START", query=ev.query, connection_type=ev.connection_payload.get('dbType', 'unknown'))
        
        await context.set("table_details", ev.table_details)
        await context.set("connection_payload", ev.connection_payload)
        await context.set("database_description", ev.database_description)
        await context.set("user_query", ev.query)
        await context.set("session_information", ev.session_information)

        table_details = ev.table_details
        
        log_step_start("START", total_tables=len(table_details))

        if len(table_details) > self.num_tables_threshold:
            log_step_start("START", message=f"Exceeds threshold of {self.num_tables_threshold} tables. Will use table retrieval step.", tables=json.dumps(table_details))
            log_step_end("START", start_time)
            return TableRetrieveEvent(tables=table_details, query=ev.query)
        else:
            log_step_start("START", message=f"Under threshold ({len(table_details)} <= {self.num_tables_threshold}). Using all tables.")
            
            # Set relevant_tables here for the direct path
            await context.set("relevant_tables", table_details)
            
            log_step_end("START", start_time)
            return TextToSQLEvent(relevant_tables=[table["tableIdentifier"] for table in table_details], query=ev.query)

    @step
    async def Retrieve_relevant_tables(self, context: Context, ev: TableRetrieveEvent) -> TextToSQLEvent | StopEvent:
        """Retrieve table context."""
        start_time = log_step_start("RETRIEVE", query=ev.query)
        
        table_details = await context.get("table_details")
        database_description = await context.get("database_description")

        # Load the table retrieval template from configuration
        from core.templates import TABLE_RETRIEVAL_SKELETON
        schema = schema_parser(table_details, "Simple", include_sample_data=False)
        TABLE_RETRIEVAL_PROMPT = TABLE_RETRIEVAL_SKELETON.format(
            database_description=database_description,
            query=ev.query,
            schema=schema
        )
        
        # Log the prompt
        log_prompt(TABLE_RETRIEVAL_PROMPT, "RETRIEVE")
        
        log_step_start("RETRIEVE", message="Querying LLM for relevant tables...")
        llm_start_time = datetime.now()
        chat_response = llm_chat_with_pydantic(
            llm=self.llm,
            prompt=PromptTemplate(TABLE_RETRIEVAL_PROMPT),
            pydantic_model=ListOfRelevantTables
        )
        relevant_tables = chat_response.relevant_tables

        if len(relevant_tables) == 0:
            log_error("RETRIEVE", "No relevant tables found")
            return StopEvent(result="Please ask a question that only references tables in the schema.")

        log_llm_operation("RETRIEVE", "LLM response", llm_start_time, chat_response)
        
        log_success("RETRIEVE", f"Extracted {len(relevant_tables)} relevant tables")
        log_step_start("RETRIEVE", relevant_tables=json.dumps(relevant_tables))
        
        await context.set("relevant_tables", relevant_tables)
        
        log_step_end("RETRIEVE", start_time)
        return TextToSQLEvent(relevant_tables=relevant_tables, query=ev.query)

    @step
    async def Generate_sql(self, context: Context, ev: TextToSQLEvent) -> SQLValidatorEvent | StopEvent:
        """Generate SQL based on the user query and table schema."""
        start_time = log_step_start("GENERATE", query=ev.query, tables=json.dumps(ev.relevant_tables))
        
        table_details = await context.get("table_details")
        connection_payload = await context.get("connection_payload")
        database_description = await context.get("database_description")
        dialect = connection_payload.get("dbType", "").upper()
        log_step_start("GENERATE", dialect=dialect)
        
        selected_tables = []
        for table_name in ev.relevant_tables:
            for table in table_details:
                if table_name.lower().strip() == table["tableIdentifier"].lower().strip():
                    selected_tables.append(table)
        
        for table in selected_tables:
            table["sample_data"] = get_sample_data_improved(
                connection_payload=connection_payload, 
                table_details=table
            )
        
        await context.set("selected_tables", selected_tables)
        
        log_step_start("GENERATE", message=f"Preparing schema information for {len(selected_tables)} tables")
        log_step_start("GENERATE", selected_tables=selected_tables)
        table_schemas = schema_parser(selected_tables, "DDL", include_sample_data=True)
        

        TEXT_TO_SQL_PROMPT = self.text2sql_prompt.format(
            user_question=ev.query,
            table_schemas=table_schemas,
            database_description=database_description,
            dialect=dialect
        )
    
        # Log the prompt
        log_prompt(TEXT_TO_SQL_PROMPT, "GENERATE")
        
        log_step_start("GENERATE", message="Querying LLM for SQL generation...")
        llm_start_time = datetime.now()
        chat_response = llm_chat_with_pydantic(
            llm=self.llm,
            prompt=PromptTemplate(TEXT_TO_SQL_PROMPT),
            pydantic_model=SQLQuery
        )
        log_llm_operation("GENERATE", "LLM response", llm_start_time, chat_response)
        
        # Extract the SQL query from the response
        sql_query = chat_response.sql_query
        log_success("GENERATE", "Extracted SQL query: " + sql_query)
        
        log_step_end("GENERATE", start_time)
        return SQLValidatorEvent(sql_query=sql_query, retry_count=0)
    
    @step
    async def Validate_SQL(self, context: Context, ev: SQLValidatorEvent) -> ExecuteSQLEvent:
        """Validate SQL query."""
        start_time = log_step_start("VALIDATE", sql=ev.sql_query)
        
        table_details = await context.get("table_details")
        
        # Extract tables from the SQL query
        log_step_start("VALIDATE", message="Extracting tables from SQL query")
        table_sql = extract_tables_from_sql(ev.sql_query)
        log_step_start("VALIDATE", tables_in_sql=json.dumps(table_sql))
        
        # Get all valid table identifiers
        valid_tables = [table["tableIdentifier"].lower().strip() for table in table_details]
        log_step_start("VALIDATE", valid_tables=json.dumps(valid_tables))

        # Check if all the tables in the SQL are in the table_details
        valid = True
        for table in table_sql:
            if table.lower().strip() not in valid_tables:
                log_error("VALIDATE", f"Invalid table found: '{table}'")
                valid = False
                break
        
        if not valid:
            log_error("VALIDATE", "SQL references tables not in provided schema")
            return StopEvent(result="Please ask a question that only references tables in the schema.")

        
        log_success("VALIDATE", "SQL query validated successfully")
        
        log_step_end("VALIDATE", start_time)
        return ExecuteSQLEvent(sql_query=ev.sql_query)

    @step
    async def Excute_SQL(self, context: Context, ev: ExecuteSQLEvent) -> SQLReflectionEvent | StopEvent:
        """ Execute SQL query."""
        start_time = log_step_start("EXECUTE", sql=ev.sql_query)
        
        connection_payload = await context.get("connection_payload")
        log_step_start("EXECUTE", connection_type=connection_payload.get('dbType', 'unknown'))
        
        log_step_start("EXECUTE", message="Sending query to database...")
        exec_start_time = datetime.now()
        payload = execute_sql(connection_payload, ev.sql_query)
        log_llm_operation("EXECUTE", "Database query", exec_start_time)
        
        if payload.get("error"):
            error_msg = payload["error"]
            log_error("EXECUTE", f"SQL execution failed with error: {error_msg}")
            
            log_step_end("EXECUTE", start_time)
            return SQLReflectionEvent(sql_query=ev.sql_query, error=error_msg, retry_count=0)
        else:
            log_success("EXECUTE", "SQL executed successfully")
            
            # Log result summary (count of rows, etc.)
            if "data" in payload and isinstance(payload["data"], list):
                log_step_start("EXECUTE", rows_returned=len(payload["data"]))
            
            log_step_end("EXECUTE", start_time)
            return StopEvent(result=ev.sql_query)
    
    @step
    async def Reflect_SQL(self, context: Context, ev: SQLReflectionEvent) -> SQLValidatorEvent | StopEvent:
        """Reflect on the SQL query with retry limit."""
        start_time = log_step_start("REFLECT")
        
        # Check retry count
        if ev.retry_count >= self.max_sql_retries:
            error_msg = f"Failed to fix SQL query after {self.max_sql_retries} attempts. Last error: {ev.error}"
            log_error("REFLECT", error_msg)
            
            log_step_end("REFLECT", start_time)
            raise AppException(error_msg, 4)
        
        # Increment retry count
        retry_count = ev.retry_count + 1
        log_step_start("REFLECT", attempt=f"{retry_count}/{self.max_sql_retries}")
        
        log_step_start("REFLECT", sql_with_error=ev.sql_query)
        log_error("REFLECT", f"Error message: {ev.error}")
        
        connection_payload = await context.get("connection_payload")
        user_query = await context.get("user_query")
        table_details = await context.get("table_details")
        database_description = await context.get("database_description")

        # Safely get relevant tables
        try:
            relevant_tables = await context.get("relevant_tables")
            log_step_start("REFLECT", cached_relevant_tables=json.dumps(relevant_tables))
        except ValueError:
            # Use all tables if relevant_tables wasn't set
            relevant_tables = [table["tableIdentifier"] for table in table_details]
            log_step_start("REFLECT", message=f"No cached relevant tables. Using all tables: {json.dumps(relevant_tables)}")
    
        selected_tables = await context.get("selected_tables")

        log_step_start("REFLECT", message=f"Preparing schema information for {len(selected_tables)} tables")
        table_schemas = schema_parser(selected_tables, "DDL", include_sample_data=True)
        
        # Load the error reflection template from configuration
        from core.templates import SQL_ERROR_REFLECTION_SKELETON
        SQL_ERROR_REFLECTION_PROMPT = SQL_ERROR_REFLECTION_SKELETON.format(
            database_schema=table_schemas,
            database_description=database_description,
            sql_query=ev.sql_query,
            error_message=ev.error,
            dialect=connection_payload.get("dbType", "").upper(),
            user_query=user_query   
        )
        
        # Log the prompt
        log_prompt(SQL_ERROR_REFLECTION_PROMPT, "REFLECT")
        
        log_step_start("REFLECT", message="Querying LLM for SQL correction...")
        llm_start_time = datetime.now()
        chat_response = llm_chat_with_pydantic(
            llm=self.llm,
            prompt=PromptTemplate(SQL_ERROR_REFLECTION_PROMPT),
            pydantic_model=SQLQuery
        )
        log_llm_operation("REFLECT", "LLM response", llm_start_time, chat_response)
        
        # Extract the corrected SQL query from the response
        corrected_sql_query = chat_response.sql_query
        
        if corrected_sql_query == ev.sql_query:
            log_warning("REFLECT", "LLM returned the same SQL query. No changes made.")
        else:
            log_success("REFLECT", "SQL query was modified by LLM")
        
        log_success("REFLECT", "Corrected SQL query: " + corrected_sql_query)
        
        log_step_end("REFLECT", start_time)
        return SQLValidatorEvent(sql_query=corrected_sql_query, retry_count=retry_count)
