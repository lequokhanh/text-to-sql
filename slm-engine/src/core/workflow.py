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
    schema_clustering,
    show_prompt,
    log_prompt,
    extract_sql_query,
    parse_schema_enrichment
)
from core.templates import (
    TABLE_EXTRACTION_TMPL,
    DATABASE_DESCRIPTION_TMPL,
    SQL_ERROR_REFLECTION_TMPL,
    SCHEMA_ENRICHMENT_TMPL
)
from exceptions.app_exception import AppException
from enums.response_enum import ResponseEnum
from core.services import execute_sql, get_sample_data
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

    tables: list[object]
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


class SchemaEnrichmentEvent(Event):
    """Event after analyzing table relationships."""
    database_description: str
    clusters: list[list]

class  SQLAgentWorkflow(Workflow):
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
        tables_brief = []
        for table in table_details:
            tables_brief.append({
                "tableIdentifier": table.get("tableIdentifier", ""),
                "tableDescription": table.get("tableDescription", "")
            })
        logger.info(f"\033[93m[START] Total tables available: {len(tables_brief)}\033[0m")

        if len(tables_brief) > self.num_tables_threshold:
            logger.info(
                f"\033[93m[START] Exceeds threshold of {self.num_tables_threshold} tables. Will use table retrieval step.\033[0m")
            logger.info("\033[94m[START] All tables: " + json.dumps(tables_brief) + "\033[0m")
            
            end_time = datetime.now()
            logger.info(f"\033[93m[START] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
            return TableRetrieveEvent(tables=tables_brief, query=ev.query)
        else:
            logger.info(f"\033[93m[START] Under threshold ({len(tables_brief)} <= {self.num_tables_threshold}). Using all tables.\033[0m")
            logger.info("\033[94m[START] Using tables: " + json.dumps(tables_brief) + "\033[0m")
            
            # Set relevant_tables here for the direct path
            await context.set("relevant_tables", [table["tableIdentifier"] for table in tables_brief])
            
            end_time = datetime.now()
            logger.info(f"\033[93m[START] Step completed in {(end_time - start_time).total_seconds():.2f} seconds\033[0m")
            return TextToSQLEvent(relevant_tables=[table["tableIdentifier"] for table in tables_brief], query=ev.query)

    @step
    async def Retrieve_relevant_tables(self, context: Context, ev: TableRetrieveEvent) -> TextToSQLEvent:
        """Retrieve table context."""
        logger.info("\033[93m[RETRIEVE] Starting table relevance filtering\033[0m")
        start_time = datetime.now()
        
        logger.info(f"\033[93m[RETRIEVE] Query: \"{ev.query}\"\033[0m")
        logger.info(f"\033[93m[RETRIEVE] Available tables: {len(ev.tables)}\033[0m")
        
        tables = []
        for table in ev.tables:
            if table["tableIdentifier"] is not None:
                formatted_table = f"- {table['tableIdentifier']} ({table['tableDescription']})"
            else:
                formatted_table = f"- {table['tableDescription']}"
            tables.append(formatted_table)


        fmt_messages = self.table_retrieval_prompt.format_messages(
            query_str=ev.query,
            table_names="\n".join(tables)
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

        logger.info(f"\033[93m[GENERATE] Retrieved {selected_tables}\033[0m")
        print(selected_tables)
        table_schemas = schema_parser(selected_tables, "DDL", include_sample_data=True)
        
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
        table_schemas = schema_parser(selected_tables, "DDL", include_sample_data=True)
        
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




class SchemaEnrichmentWorkflow(Workflow):
    """Workflow for enriching database schema with semantic descriptions."""

    def __init__(
        self,
        # schema_enrichment_prompt: PromptTemplate,
        llm: Ollama,
        *args, **kwargs
    ) -> None:
        """Initialize the SQLAgent Workflow."""
        super().__init__(*args, **kwargs)
        # self.schema_enrichment_prompt = schema_enrichment_prompt
        self.llm = llm
        self._timeout = 3000.0

    @step
    async def Start_workflow(self, context: Context, ev: StartEvent) -> SchemaEnrichmentEvent:
        await context.set("connection_payload", ev.connection_payload)
        await context.set("database_schema", ev.database_schema)

        # Get all table names
        brief_schema_presentation = schema_parser(ev.database_schema, "Simple")
        fmt_messages = DATABASE_DESCRIPTION_TMPL.format_messages(
            schema=brief_schema_presentation
        )
        log_prompt(fmt_messages, "GENERATE")
        chat_response = self.llm.chat(fmt_messages)
        database_description = chat_response.message.content
        logger.info(f"\033[92m[GENERATE] Database description: {database_description}\033[0m")

        # Cluster schema
        clusters = schema_clustering(ev.database_schema, resolution_value=2.5)
        for cluster in clusters:
            for table in cluster:
                table["sample_data"] = get_sample_data(
                    connection_payload=ev.connection_payload, 
                    table_details=table
                )
        return SchemaEnrichmentEvent(database_description=database_description, clusters=clusters)


    @step
    async def Schema_Enrichment(self, context: Context, ev: SchemaEnrichmentEvent) -> StopEvent:
        """Generate database description and cluster schema."""
        cluster_infos = []
        for cluster in ev.clusters:
            prompt = schema_parser(cluster, "Simple", include_sample_data=True)
            cluster_infos.append(prompt)
            print(prompt)

        cluster_enriched = []
        for c in cluster_infos:
            fmt_messages = SCHEMA_ENRICHMENT_TMPL.format_messages(
                cluster_info=c,
                db_info=ev.database_description
            )
            log_prompt(fmt_messages, "GENERATE")
            chat_response = self.llm.chat(fmt_messages)
            cluster_enriched.append(parse_schema_enrichment(chat_response))
            
        # Lấy database_schema từ context
        database_schema = await context.get("database_schema")

        
        # Tạo mapping từ table_name đến mô tả của bảng và cột
        enrichment_map = {}
        for cluster_data in cluster_enriched:
            for table_info in cluster_data:
                table_name = table_info.get('table_name')
                if not table_name:
                    continue
                    
                # Tạo mapping cho bảng
                if table_name not in enrichment_map:
                    enrichment_map[table_name] = {
                        'table_description': table_info.get('description', ''),
                        'columns': {}
                    }
                
                # Tạo mapping cho các cột
                for column_info in table_info.get('columns', []):
                    column_name = column_info.get('column_name')
                    if column_name:
                        enrichment_map[table_name]['columns'][column_name] = column_info.get('description', '')
        logger.info(f"\033[92m[GENERATE] Database schema enrichment map: {enrichment_map}\033[0m")
        # Cập nhật mô tả cho các bảng và cột trong database_schema
        # Cập nhật mô tả cho các bảng và cột trong database_schema
        for table in database_schema:
            table_name = table.get('tableIdentifier')
            if table_name in enrichment_map:
                # Chỉ cập nhật mô tả bảng nếu trường hiện tại trống
                table_description = table.get('tableDescription', '')
                if not table_description and enrichment_map[table_name]['table_description']:
                    table['tableDescription'] = enrichment_map[table_name]['table_description']
                
                # Cập nhật mô tả cột
                for column in table.get('columns', []):
                    column_name = column.get('columnIdentifier')
                    if column_name in enrichment_map[table_name]['columns']:
                        # Chỉ cập nhật mô tả cột nếu trường hiện tại trống
                        if (column.get("columnDescription", "") in ["", "NULL", "''"] or 
                            column.get("columnDescription") is None or 
                            len(str(column.get("columnDescription", ""))) <= 1):
                            column["columnDescription"] = enrichment_map[table_name]['columns'][column_name]
        result = {
            "database_description": ev.database_description,
            "enriched_schema": database_schema
        }
        logger.info(f"\033[92m[GENERATE] Database description: {ev.database_description}\033[0m")
        logger.info(f"\033[92m[GENERATE] Database schema: {database_schema}\033[0m")
        return StopEvent(result=result)


