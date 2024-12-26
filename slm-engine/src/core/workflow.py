from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Event,
    Context,
)

from t2sqlcore.utils import (
    sql_parser,
    reason_parser,
    get_primer,
    format_question,
    code_parser,
    df_preprocess,
    execute_and_save_plot_with_df,
)
from t2sqlcore._templates import (
    SEMANTIC_HELPER_TMPL,
    SQL_REFLECTION_TMPL,
    SQL_FIXER_TMPL,
    SQL_EXECUTION_LOG_TMPL,
    TEXT_TO_VIZ_CODE_TMPL,
    VISUAL_SUGGESTION_PROMPT_TMPL,
    DATAFRAME_LABEL_TMPL,
)
from llama_index.core import Settings
from t2sqlcore.Instance import Instance

import json
import pandas as pd


class ErrorDetectEvent(Event):
    """Error detection event."""

    error: str
    wrong_sql: str


class GenerateSQLEvent(Event):
    """Text-to-SQL event."""

    sql: str


class GenerateFixSQLEvent(Event):
    """Text-to-SQL event."""

    sql: str


class GenerateSemanticSQLEvent(Event):
    """Text-to-SQL event."""

    sql: str


class SemanticHelperEvent(Event):
    """Semantic Helper event."""

    sql: str
    sql_result: json


class TextToSQLWorkflow(Workflow):
    """Text2SQL Workflow."""

    def __init__(self, instance: Instance, *args, **kwargs) -> None:
        """Initialize the Text2SQL Workflow."""
        super().__init__(*args, **kwargs)
        self.instance = instance
        self.llm = Settings.llm
        self.embedding = Settings.embed_model

    @step
    async def generate_sql(self, context: Context, ev: StartEvent) -> GenerateSQLEvent:
        """Retrieve table context."""
        text2sql_prompt, components = self.instance.get_context_prompt(
            question=ev.question, instructions=ev.instructions
        )
        print("\033[94m" + text2sql_prompt + "\033[0m")
        response = await self.llm.acomplete(prompt=text2sql_prompt)
        print("\033[92m" + response.text + "\033[0m")
        sql = sql_parser(response=response)
        await context.set("question", ev.question)
        await context.set("instructions", ev.instructions)
        await context.set("config", ev.config)
        await context.set("semantic_component", components)
        await context.set("schema", "\n".join(v for k, v in components.items()))
        await context.set("exec_logs", [])
        print("\033[92m" + sql + "\033[0m")
        return GenerateSQLEvent(sql=sql)

    @step
    async def execute_sql(
        self,
        context: Context,
        ev: GenerateSQLEvent | GenerateFixSQLEvent | GenerateSemanticSQLEvent,
    ) -> SemanticHelperEvent | ErrorDetectEvent:
        """Generate SQL."""
        sql = ev.sql
        payload = self.instance.database.execute_sql_query(sql=sql)

        if payload["status"] == "success":
            return SemanticHelperEvent(sql=sql, sql_result=payload["result"])

        if payload["status"] == "failure":
            error = payload["result"]
            return ErrorDetectEvent(error=error, wrong_sql=sql)

    @step
    async def sql_reflection(
        self, context: Context, ev: ErrorDetectEvent
    ) -> GenerateFixSQLEvent | StopEvent:
        """Generate response."""
        question = await context.get("question")
        wrong_sql = ev.wrong_sql
        error = ev.error
        schema = await context.get("schema")
        exec_logs = await context.get("exec_logs")
        print("\n\033[91m" + error + "\033[0m")
        prompt = SQL_REFLECTION_TMPL.format(
            dialect="Postgres",
            semantic_schema=schema,
            question=question,
            previous_logs="\n".join(exec_logs),
            error=error,
            sql=wrong_sql,
        )
        response = await self.llm.acomplete(prompt=prompt)
        reason = reason_parser(response)
        print("\n\033[91m" + prompt + "\033[0m")
        print("\n\033[93m" + "Reason: " + "\033[0m" + reason)
        prompt = SQL_FIXER_TMPL.format(
            dialect="Postgres",
            semantic_schema=schema,
            question=question,
            previous_logs="\n".join(exec_logs),
            error=error,
            sql=wrong_sql,
            error_reason=reason,
        )
        response = await self.llm.acomplete(prompt=prompt)
        fixed_sql = sql_parser(response=response)
        print("\n\033[91m" + prompt + "\033[0m")
        print("\n\033[93m" + "Fixed SQL: " + "\033[0m" + fixed_sql)

        log = {
            "sql": wrong_sql,
            "error": error,
            "reason": reason,
            "new_sql": fixed_sql,
        }
        exec_logs.append(
            SQL_EXECUTION_LOG_TMPL.format(no_attempt=len(exec_logs), **log)
        )
        if len(exec_logs) > 3:
            response = {
                "sql": fixed_sql,
                "result": "MAX attempt exceeded - " + error,
            }
            return StopEvent(result=exec_logs)
        print("\n\033[91m" + str(exec_logs) + "\033[0m")
        await context.set("exec_logs", exec_logs)
        return GenerateFixSQLEvent(sql=fixed_sql)

    @step
    async def semantic_helper(
        self, context: Context, ev: SemanticHelperEvent
    ) -> StopEvent | GenerateSemanticSQLEvent:
        """Generate response."""
        semantic_component = await context.get("semantic_component")
        schema = "\n".join(v for k, v in semantic_component.items())
        question = await context.get("question")
        sql = ev.sql
        sql_result = pd.DataFrame(
            ev.sql_result["rows"], columns=ev.sql_result["columns"]
        )

        print("\n\033[92m" + "RawSQL:" + "\033[0m\n" + sql)
        print("\n\033[92m" + "SQL Result:" +
              "\033[0m\n" + sql_result.to_markdown())

        prompt = SEMANTIC_HELPER_TMPL.format(
            dialect="Postgres",
            sql=sql,
            sql_result=sql_result.to_markdown(),
            question=question,
            semantic_schema=schema,
        )
        response = await self.llm.acomplete(prompt=prompt)
        corected_sql = sql_parser(response=response)
        print("\n\033[92m" + prompt + "\033[0m")
        print("\n\033[93m" + "Corrected SQL: " + "\033[0m" + corected_sql)
        if corected_sql == sql:
            response = {
                "sql": corected_sql,
                "result": sql_result.to_json(orient="split"),
            }
            print(response)
            return StopEvent(result=response)
        else:
            new_sql = corected_sql
            return GenerateSemanticSQLEvent(sql=new_sql)


class SuggestVisEvent(Event):
    """Suggest Visualization event."""

    visual_type: str
    dataframe: pd.DataFrame


class Chat2VisWorkflow(Workflow):
    """Chat2Vis Workflow."""

    def __init__(self, *args, **kwargs) -> None:
        """Initialize the Chat2Vis Workflow."""
        super().__init__(*args, **kwargs)
        self.llm = Settings.llm

    @step
    async def suggest_visualization(
        self, context: Context, ev: StartEvent
    ) -> SuggestVisEvent:
        """Suggest visualization."""
        dataframe = pd.read_json(ev.dataframe, orient="split")
        sql = ev.sql
        addtional_instructions = ev.requirement
        await context.set("instructions", addtional_instructions)
        await context.set("question", ev.question)
        prompt = VISUAL_SUGGESTION_PROMPT_TMPL.format(
            results=dataframe.to_markdown(), sql=sql, question=ev.question
        )
        response = await self.llm.acomplete(prompt=prompt)
        payload = response.text.split("\n")
        viz_type = payload[0].strip()
        print("\033[94m" + prompt + "\033[0m")
        print("\033[92m" + viz_type + "\033[0m")
        print("\033[91m" + payload[1] + "\033[0m")
        return SuggestVisEvent(visual_type=viz_type, dataframe=dataframe)

    @step
    async def generate_visualization(
        self, context: Context, ev: SuggestVisEvent
    ) -> StopEvent:
        """Generate visualization."""
        dataframe = ev.dataframe
        viz_type = ev.visual_type
        addtional_instructions = await context.get("instructions")
        question = await context.get("question")
        prompt = DATAFRAME_LABEL_TMPL.format(
            dataframe=dataframe.to_markdown(),
            question=question,
            original_labels=dataframe.columns,
            chart_type=viz_type,
        )
        response = await self.llm.acomplete(prompt=prompt)
        print("\033[92m" + response.text + "\033[0m")
        new_labels = eval(response.text)
        print(type(new_labels))
        dataframe.rename(columns=new_labels, inplace=True)
        dataframe = df_preprocess(dataframe)
        print("\033[92m" + dataframe.to_markdown() + "\033[0m")
        if len(dataframe) > 1 and len(dataframe.columns) > 1:
            primer_desc, primer_code = get_primer(dataframe, "dataframe")
            formatted_question = format_question(
                primer_desc, primer_code, question, "\n. " + addtional_instructions
            )
            chat2vis_prompt = TEXT_TO_VIZ_CODE_TMPL.format(
                code_snippet=formatted_question,
                type=viz_type.upper(),
                question=question,
            )
            print("\033[94m" + chat2vis_prompt + "\033[0m")
            response = await self.llm.acomplete(prompt=chat2vis_prompt)
            completion_code = response.text
            print("\033[92m" + completion_code + "\033[0m")
            # code = code_parser(response)
            code = primer_code + completion_code
            code = code_parser(code)
            print("\033[94m" + code + "\033[0m")
            image_object = execute_and_save_plot_with_df(
                code_str=code, dataframe=dataframe
            )
            return StopEvent(result=image_object)
        code = code_parser("", null_image_object=True)
        null_image_object = execute_and_save_plot_with_df(
            code_str="code", dataframe=dataframe
        )
        return StopEvent(result=null_image_object)
