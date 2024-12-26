import json
import os

# from Component.config import MilvusVectorDatabase
from llama_index.core.llms import ChatResponse
import re
# from t2sqlcore.Instance import Instance

# from t2sqlcorr._templates import VIS_PROMT_TMPL_ADV
import pandas as pd
from llama_index.core.schema import NodeWithScore
from typing import List
from dotenv import load_dotenv
from llama_index.core.base.llms.types import (
    CompletionResponse,
)
# from matplotlib import pyplot as plt
import io
# from flask import Flask, request, jsonify, make_response
from sqlalchemy import (
    Integer,
    Float,
    String,
    Text,
    LargeBinary,
    Boolean,
    Date,
    DateTime,
    Numeric,
    Time,
)

load_dotenv()

# INSTANCES_PATH = os.path.abspath(os.getenv("INSTANCES_DIR"))


def get_table_metadata(collection: str):
    """Get table element."""
    path = os.path.join(INSTANCES_PATH, collection, "metadata.json")

    return json.load(open(path))


# def get_table_context(collection: str):
#     """Get table context."""
#     # table_obj, dictionary = get_table_element(collection)
#     table_name = table_obj["table_name"]
#     description = table_obj["description"]

#     TABLE_CTX_PROMPT = TABLE_CTX_TMPL_WITHOUT_SAMPLE.format(
#         table_name=table_name, description=description
#     )

#     return TABLE_CTX_PROMPT


# def get_table_context_and_rows_str(query_str: str, collection: str, vectordb):
#     """Get table context string."""

#     metadata = get_table_metadata(collection)
#     table_name = metadata["table_name"]
#     description = metadata["context"]
#     ddl_str = metadata["DDL"]

#     result = vectordb.hybrid_search(query=query_str)

#     column_ord = result["columns_order"]
#     relevant_nodes = result["rerank_results"]
#     sample_rows = ""
#     if len(relevant_nodes) > 0:
#         for node in relevant_nodes:
#             sample_rows += f"{node['text']},\n"

#     # TABLE_CTX_PROMPT = TABLE_CTX_TMPL.format(
#     #     table_name=table_name,
#     #     description=description,
#     #     column_order=column_ord,
#     #     sample_row=sample_rows,
#     # )
#     # TABLE_CTX_PROMPT = TABLE_CTX_TMPL.format(
#     #     DDL_statements=ddl_str,
#     #     table_name=table_name,
#     #     columns=column_ord,
#     #     values=sample_rows,
#     # )
#     return TABLE_CTX_PROMPT


def reason_parser(response: CompletionResponse) -> str:
    """Reason parser."""
    response = response.text.lower()
    reason_start = response.find("reason:")
    if reason_start != -1:
        return response.split("reason:")[1].strip()
    return response


def sql_parser(response: CompletionResponse) -> str:
    """SQL parser."""
    response = response.text

    sql_query_start = response.find("SQLQuery:")
    if sql_query_start != -1:
        response = response[sql_query_start:]
        # TODO: move to removeprefix after Python 3.9+
        if response.startswith("SQLQuery:"):
            response = response[len("SQLQuery:"):]

    response = response[response.find("SELECT"):]

    if response.endswith("```"):
        response = response[: response.find("```")]

    if response.find(";") != -1:
        response = response[: response.find(";")]

    if response.count("'") % 2 != 0:
        response = response + "'"
    if response.count("(") > response.count(")"):
        c = response.count("(") - response.count(")")
        response = response + ")" * c

    sql = response.strip().strip("```").strip()
    return sql


# def sql_rule_parser(
#     response: CompletionResponse, role: str, company: str, instance: Instance
# ):
#     """SQL parser with rules."""
#     sql = sql_parser(response)
#     print("\033[92m" + "PRE: " + sql + "\033[0m")
#     sql_role_statement = re.search(r"MIEN\s*=\s*'([^']*)'", sql, re.IGNORECASE)
#     sql_role_statement = sql_role_statement.group(
#         0) if sql_role_statement else None
#     sql_company_statement = re.search(
#         r"CONG_TY\s*=\s*'([^']*)'", sql, re.IGNORECASE)
#     sql_company_statement = (
#         sql_company_statement.group(0) if sql_company_statement else None
#     )
#     if role == "*":
#         roletmpl = ""
#     else:
#         tmpl = ""
#         if role == "**":
#             comptmpl = "CONG_TY='{}'".format(company)
#             if sql_company_statement is not None:
#                 sql = sql.replace(sql_company_statement, comptmpl)
#             tmpl = comptmpl
#         else:
#             roletmpl = "MIEN='{}'".format(role)
#             comptmple = "CONG_TY='{}'".format(company)
#             if sql_role_statement is not None:
#                 sql = sql.replace(sql_role_statement, roletmpl)
#             if sql_company_statement is not None:
#                 sql = sql.replace(sql_company_statement, comptmple)
#             tmpl = roletmpl + " AND " + comptmple

#         if sql.upper().find("WHERE") == -1:
#             sql = sql.replace(
#                 f"FROM {instance.name}", f"FROM {instance.name} WHERE " + tmpl
#             )
#         else:
#             sql = sql.replace("WHERE", f"WHERE {tmpl} AND")

#     try:
#         print("\033[92m" + "POST: " + sql + "\033[0m")
#         pd.read_sql_query(sql, instance.database.engine)
#     except Exception as e:
#         sql = "SELECT 'No result found' as Response"
#         print(e)

#     return sql


def sql_rows_parser(results: List[NodeWithScore]) -> str:
    """SQL rows parser."""
    if not results:
        return "\nNo results found..."

    header = results[0].metadata["col_keys"]
    col_keys = [h.split(":")[0] for h in header]

    # Create table header
    context_str = "\n|" + " | ".join(col_keys) + "|\n|"
    context_str += "".join(["-" * len(col) + " | " for col in col_keys])
    context_str += "\n"

    # Add rows
    for node in results:
        rows = node.metadata["result"]
        print(type(rows))
        for item in rows:
            context_str += "|" + " | ".join([str(i) for i in item]) + "|\n"

    return context_str


def markdown_result(results: List[NodeWithScore]) -> str:
    """Markdown result."""
    if not results:
        return "\nNo results found..."

    header = results[0].metadata["col_keys"]
    col_keys = [h.split(":")[0] for h in header]

    # Create table header
    context_str = "\n|" + " | ".join(col_keys) + "|\n|"
    context_str += "".join(["-" * len(col) + " | " for col in col_keys])
    context_str += "\n"

    # Add rows
    for node in results:
        rows = node.metadata["result"]
        for item in rows:
            context_str += "|" + " | ".join([str(i) for i in item]) + "|\n"

    return context_str


def dataframe_parser(results) -> pd.DataFrame:
    """Dataframe result."""
    if not results:
        return pd.DataFrame()
    from datetime import date

    columns = results["columns"]
    rows = results["rows"]

    return pd.DataFrame(rows, columns=columns)


# def visualize_prompt(dataframe: pd.DataFrame, title: str):
#     vis_prompt = VIS_PROMT_TMPL_ADV.format(real_df=dataframe, title=title)
#     return vis_prompt


def get_json_response(response: CompletionResponse) -> dict:
    prefix = "```json"
    postfix = "```"
    response_text = response.text
    if prefix in response_text:
        response_text = response_text.split(prefix)[1]
    if postfix in response_text:
        response_text = response_text.split(postfix)[0]

    # Print the raw JSON string to show escaped sequences
    print("Raw response:", response_text.strip())

    try:
        # Load and print the decoded JSON content
        decoded_json = json.loads(response_text.strip())
        print("Decoded JSON:", json.dumps(
            decoded_json, ensure_ascii=False, indent=2))
        return decoded_json
    except Exception as e:
        print(f"Error decoding JSON: {e}")
        return response_text


def generate_chart_from_json(json_data):
    data = json_data
    chart_type = data.get("type", "bar")
    title = data.get("title", "")
    labels = data["data"]["labels"]

    # Define conversion factor and label suffix
    conversion_factor = 1e6  # Convert to million VNĐ (triệu VNĐ)
    label_suffix = " triệu"
    fontsize = 8

    # Filter out None values from the dataset
    values = [v for v in data["data"]["datasets"]
              [0]["values"] if v is not None]

    # Perform the comparison if the list is not empty
    if values and max(values) > conversion_factor:
        title += " (Đơn vị: triệu)"

    def convert_values(values):
        """Convert values if they exceed a threshold."""
        if max(values) > conversion_factor:
            return [value / conversion_factor for value in values], label_suffix
        else:
            return values, ""

    if chart_type == "pie":
        values = data["data"]["datasets"][0]["values"]
        options = data.get("options", {})
        converted_values, suffix = convert_values(values)
        plt.pie(
            converted_values,
            explode=options.get("explode", None),
            shadow=options.get("shadow", False),
            startangle=options.get("startangle", 0),
            labels=labels,
            autopct=lambda p: f"{p:.1f}%",
        )
        plt.title(title)

    elif chart_type == "bar":
        datasets = data["data"]["datasets"]
        options = data.get("options", {})
        width = options.get("bar_width", 0.35)

        if options.get("stacked", False):
            bottom = [0] * len(labels)
            for dataset in datasets:
                converted_values, suffix = convert_values(dataset["values"])
                plt.bar(labels, converted_values,
                        width, label=dataset["label"])
                # Add numbers to the bars
                for x, (y, b) in enumerate(zip(converted_values, bottom)):
                    plt.text(
                        x,
                        y + b + 0.2,
                        f"{y:.2f}{suffix}",
                        ha="center",
                        va="bottom",
                        fontsize=fontsize,
                    )
                bottom = [i + j for i, j in zip(bottom, converted_values)]
        else:
            for i, dataset in enumerate(datasets):
                bar_positions = [x + i * width for x in range(len(labels))]
                converted_values, suffix = convert_values(dataset["values"])
                plt.bar(bar_positions, converted_values,
                        width, label=dataset["label"])
                # Add numbers to the bars
                for x, y in zip(bar_positions, converted_values):
                    plt.text(
                        x,
                        y + 0.2,
                        f"{y:.2f}{suffix}",
                        ha="center",
                        va="bottom",
                        fontsize=fontsize,
                    )
        plt.title(title)
        plt.legend()

    elif chart_type == "line":
        datasets = data["data"]["datasets"]
        options = data.get("options", {})
        for dataset in datasets:
            converted_values, suffix = convert_values(dataset["values"])
            plt.plot(
                labels,
                converted_values,
                label=dataset["label"],
                linestyle=options.get("linestyle", "-"),
                marker=options.get("marker", "o"),
            )

        plt.title(title)
        plt.legend()

        # Rotate x-axis labels
        plt.xticks(rotation=45, ha="right")
        # Adjust x-axis label font size
        plt.xticks(fontsize=fontsize)
        # Adjust layout to avoid clipping
        plt.tight_layout()

    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format="png")
    img.seek(0)
    plt.close()

    return img


def get_primer(df_dataset, df_name):
    # Primer function to take a dataframe and its name
    # and the name of the columns
    # and any columns with less than 20 unique values it adds the values to the primer
    # and horizontal grid lines and labeling
    primer_desc = (
        "1. Use a dataframe called 'df' from a SQL Query Result, 'dataframe' variable is already loaded with the SQL query result with columns '"
        + "','".join(str(x) for x in df_dataset.columns)
        + "'. "
    )
    for i in df_dataset.columns:
        if len(df_dataset[i].drop_duplicates()) < 20 and df_dataset.dtypes[i] == "O":
            primer_desc = (
                primer_desc
                + "\n- The column '"
                + i
                + "' has categorical values '"
                + "','".join(str(x) for x in df_dataset[i].drop_duplicates())
                + "'. "
            )
        elif df_dataset.dtypes[i] == "int64" or df_dataset.dtypes[i] == "float64":
            primer_desc = (
                primer_desc
                + "\n- The column '"
                + i
                + "' is type "
                + str(df_dataset.dtypes[i])
                + " and contains numeric values. "
            )
        else:
            primer_desc = (
                primer_desc
                + "\n- The column '"
                + i
                + "' is type "
                + str(df_dataset.dtypes[i])
                + ". Has more than 20 unique categorical values, first 5 values are: "
                + ",".join(str(x)
                           for x in df_dataset[i].drop_duplicates().head(5))
                + ". "
            )
    primer_desc = primer_desc + "\n2. Label the x and y axes appropriately."
    primer_desc = (
        primer_desc
        + "\n3. Add a title. Set the fig suptitle as empty."
        + "\n4. Pay attention to the Chart style, Chart title, X-axis label, Y-axis label, and the color of the chart. Make sure the chart is clear and the labels/components are not overlapping."
        + "\n5. X-axis label should be rotated 45 degrees."
    )
    primer_desc = (
        primer_desc
        + "\n***IMPOTANT*** Using Python version 3.9.12, create a script using the dataframe df to generate a chart that best represents the data and suitable for answering the following question and requirements:\n"
    )
    primer_desc = primer_desc + "### Requirements: {}"
    primer_desc = primer_desc + "\n### Question: "
    pimer_code = "import pandas as pd\nimport matplotlib.pyplot as plt\n"
    pimer_code = pimer_code + "fig,ax = plt.subplots(1,1,figsize=(10,5))\n"
    pimer_code = (
        pimer_code
        + "ax.spines['top'].set_visible(False)\nax.spines['right'].set_visible(False) \n"
    )
    pimer_code = pimer_code + "df = " + df_name + ".copy()\n"
    return primer_desc, pimer_code


def format_question(primer_desc, primer_code, question, addtional_instructions=None):
    # Fill in the model_specific_instructions variable
    instructions = "" if addtional_instructions is None else addtional_instructions
    primer_desc = primer_desc.format(instructions)
    # Put the question at the end of the description primer within quotes, then add on the code primer.
    return '"""\n' + primer_desc + question + '\n"""\n' + primer_code


def df_preprocess(dataframe: pd.DataFrame) -> pd.DataFrame:
    # Scale the numeric columns to millions if needed
    for col in dataframe.columns:
        if pd.api.types.is_numeric_dtype(dataframe[col]):
            dataframe[col], suffix = _scale_values(dataframe[col])
            if suffix:
                print(f"Column '{col}' values have been scaled to millions.")
            # Add the suffix to the column name
            dataframe.rename(columns={col: col + suffix}, inplace=True)

    # Print the scaled dataframe
    print("Dataframe after scaling:")
    print(dataframe)
    return dataframe


def code_parser(code: str, null_image_object=False) -> str:
    """find ```python and ``` and extract the code between them"""

    if null_image_object:
        code = """
import pandas as pd
import matplotlib.pyplot as plt

# Create an empty DataFrame
df = pd.DataFrame()

# Generate the plot
fig, ax = plt.subplots()

# Check if DataFrame is empty
if df.empty:
    ax.text(0.5, 0.5, 'No data available', fontsize=20, ha='center', va='center', color='gray')
    ax.set_xticks([])  # Remove x-axis ticks
    ax.set_yticks([])  # Remove y-axis ticks

# Save or display the plot
plt.savefig('no_data_image.png')
        """
        return code

    essential = """
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
    """

    code = code.replace("```python", "")
    code = code.replace("```", "")
    code = code.strip()
    code = code.replace(
        "plt.show()",
        essential,
    )
    if not code.endswith("plt.tight_layout()"):
        code = code + essential
    # Return an empty string if no code block is found
    return code


def _scale_values(column: pd.Series) -> pd.Series:
    """
    Scale the values in a numeric column to millions if they exceed a threshold.

    Args:
        column (pd.Series): The column to be scaled.

    Returns:
        scaled_column (pd.Series): The scaled column.
    """
    # Define the conversion factor and label suffix
    conversion_factor = [
        1e6,
        1e9,
    ]  # Convert to million or billion VNĐ (triệu or tỷ VNĐ)
    label_suffix = ["(triệu)", "(tỷ)"]  # Million or billion suffix

    # Perform the scaling if the values exceed the threshold
    if column.max() > conversion_factor[0]:
        scaled_column = column / conversion_factor[0]
        suffix = label_suffix[0]
    elif column.max() > conversion_factor[1]:
        scaled_column = column / conversion_factor[1]
        suffix = label_suffix[1]
    else:
        scaled_column = column
        suffix = ""

    return scaled_column, suffix


def execute_and_save_plot_with_df(code_str: str, dataframe: pd.DataFrame):
    """
    Executes the provided Python code string, allowing the use of a dynamic dataframe, saves the resulting plot
    as a PNG in a BytesIO object, and returns the image object.

    Args:
        code_str (str): Python code as a string that includes a plotting operation and plt.show().
        dataframe (pd.DataFrame): The dataframe to be used in the code string.

    Returns:
        img (BytesIO): The image object containing the plot saved as a PNG.
    """
    # Create a BytesIO object to save the plot image
    img = io.BytesIO()

    # Create a local dictionary for the exec() context, including df_sql
    local_dict = {"dataframe": dataframe,
                  "df": dataframe, "plt": plt, "pd": pd}
    # Add a try-except block to catch any errors during code execution
    try:
        # Execute the code string in the context of local_dict
        exec(code_str, {}, local_dict)

        # Save the current figure to the BytesIO object
        plt.savefig(img, format="png")
        img.seek(0)  # Rewind the BytesIO object to the beginning

    except Exception as e:
        print(f"Error during execution: {e}")
    finally:
        # Close the plot to free resources
        plt.close()

    # Return the image object
    return img


def dialect_dtype_mapping(dialect: str, sql_type: str):
    """
    Maps SQL data types from various dialects to SQLAlchemy data types.

    Args:
        dialect (str): The SQL dialect (e.g., 'sqlite', 'postgres', 'mysql').
        sql_type (str): The data type in the SQL dialect.

    Returns:
        sqlalchemy.sql.type_api.TypeEngine: Corresponding SQLAlchemy data type.

    Raises:
        ValueError: If the SQL dialect or data type is unsupported.
    """
    # Define mappings for each SQL dialect
    mappings = {
        "sqlite": {
            "INTEGER": Integer,
            "REAL": Float,
            "TEXT": Text,
            "BLOB": LargeBinary,
            "NUMERIC": Numeric,
            "BOOLEAN": Boolean,
            "DATETIME": DateTime,
            "DATE": Date,
            "TIME": Time,
        },
        "postgres": {
            "INTEGER": Integer,
            "SERIAL": Integer,
            "BIGINT": Integer,
            "SMALLINT": Integer,
            "REAL": Float,
            "DOUBLE PRECISION": Float,
            "TEXT": Text,
            "VARCHAR": String,
            "CHAR": String,
            "BYTEA": LargeBinary,
            "NUMERIC": Numeric,
            "BOOLEAN": Boolean,
            "TIMESTAMP": DateTime,
            "DATE": Date,
            "TIME": Time,
        },
        "mysql": {
            "INT": Integer,
            "BIGINT": Integer,
            "SMALLINT": Integer,
            "FLOAT": Float,
            "DOUBLE": Float,
            "TEXT": Text,
            "VARCHAR": String,
            "CHAR": String,
            "BLOB": LargeBinary,
            "DECIMAL": Numeric,
            "TINYINT(1)": Boolean,
            "DATETIME": DateTime,
            "DATE": Date,
            "TIME": Time,
        },
    }

    # Normalize inputs
    dialect = dialect.lower()
    sql_type = sql_type.upper()

    # Validate dialect
    if dialect not in mappings:
        raise ValueError(f"Unsupported SQL dialect: {dialect}")

    # Map type
    sqlalchemy_type = mappings[dialect].get(sql_type)
    if sqlalchemy_type is None:
        raise ValueError(
            f"Unsupported SQL type '{sql_type}' for dialect '{dialect}'")

    return sqlalchemy_type
