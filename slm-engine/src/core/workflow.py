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
    schema_parser,
    show_prompt,
    extract_sql_query
)
from llama_index.core import PromptTemplate
from llama_index.llms.ollama import Ollama
import re


class TableRetrieveEvent(Event):
    """Result of running table retrieval."""

    table_names: list[str]
    query: str


class TextToSQLEvent(Event):
    """Text-to-SQL event."""
    relevant_tables: list[str]
    query: str


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
        self.llm = llm

    @step
    async def start_workflow(self, context: Context, ev: StartEvent) -> TableRetrieveEvent | TextToSQLEvent:
        """Start the SQLAgent Workflow."""
        table_details = ev.table_details

        table_names = [table["tableIdentifier"] for table in table_details]
        await context.set("table_details", table_details)
        if len(table_names) > self.num_tables_threshold:
            print(
                f"Exceeds threshold of {self.num_tables_threshold}. Number of tables: {len(table_names)}")
            print("\033[94mAll tables:\033[0m " + str(table_names) + "\n")
            return TableRetrieveEvent(table_names=table_names, query=ev.query)
        else:
            return TextToSQLEvent(relevant_tables=table_names, query=ev.query)

    @step
    def retrieve_relevant_tables(self, context: Context, ev: TableRetrieveEvent) -> TextToSQLEvent:
        """Retrieve table context."""
        print("Retrieving only relevant tables...")
        fmt_messages = self.table_retrieval_prompt.format_messages(
            query_str=ev.query,
            table_names="\n".join(ev.table_names)
        )
        show_prompt(fmt_messages)
        chat_response = self.llm.chat(fmt_messages)
        print("\033[94m" + str(chat_response) + "\033[0m")
        relevant_tables = extract_table_list(chat_response)
        print("\033[94mRelevant tables:\033[0m " + str(relevant_tables) + "\n")
        return TextToSQLEvent(relevant_tables=relevant_tables, query=ev.query)

    @step
    async def generate_sql(self, context: Context, ev: TextToSQLEvent) -> StopEvent:
        """Generate SQL based on the user query and table schema."""
        print("Generating SQL...")
        table_details = await context.get("table_details")
        selected_tables = []
        for table_name in ev.relevant_tables:
            for table in table_details:
                if table_name.lower().strip() == table["tableIdentifier"].lower().strip():
                    selected_tables.append(table)
        table_schemas = schema_parser(selected_tables, "DDL")
        fmt_messages = self.text2sql_prompt.format_messages(
            user_question=ev.query,
            table_schemas=table_schemas
        )
        show_prompt(fmt_messages)
        chat_response = self.llm.chat(fmt_messages)
        response_content = chat_response.message.content
        print("\033[94m" + str(chat_response) + "\033[0m")
        # Extract the SQL query from the response
        sql_query = extract_sql_query(response_content)
        print("\033[92mExtracted SQL query:\033[0m " + sql_query)
        
        return StopEvent(result=sql_query)
