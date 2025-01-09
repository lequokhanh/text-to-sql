from flask import Flask, request, jsonify
from llama_index.llms.ollama import Ollama
import sqlalchemy
from sqlalchemy import create_engine
import sqlparse
import os
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)


def generate_ddl(schema):
    """Generate DDL statements from the schema."""
    column_template = "{name} {dtype} {primary_key}, //{description}"
    table_template = "CREATE TABLE {table_name} (\n    {columns}\n);"

    tables = []
    for table in schema.get("tables", []):
        for column in table.get("columns", []):
            column["primary_key"] = "PRIMARY KEY" if column["name"] in table.get(
                "primary_keys", []) else ""

        columns = "\n    ".join([column_template.format(**column)
                                for column in table.get("columns", [])])
        table_ddl = table_template.format(
            table_name=table["name"], columns=columns)
        tables.append(table_ddl)

    return tables


def load_prompt_template(model_name):
    """Load the prompt template for the specified model."""
    model_file_name = model_name.replace("/", "_").replace(":", "_")
    for prompt_file in os.listdir("../prompt_hub"):
        print(prompt_file)
        if model_file_name in prompt_file:
            path = os.path.join("../prompt_hub", prompt_file)
            logging.info(f"Loading prompt from {path}")
            with open(path, "r") as file:
                return file.read()
    logging.error(f"Prompt file for model {model_file_name} not found")
    return None


def generate_sql(model, database_schema, question):
    """Generate SQL based on the model, schema, and user question."""
    prompt_template = load_prompt_template(model.model)
    if not prompt_template:
        raise ValueError("Prompt template not found for the specified model")

    prompt = prompt_template.format(
        user_question=question,
        instructions="",
        create_table_statements="\n".join(generate_ddl(database_schema))
    )
    logging.info(f"Generated prompt: {prompt}")

    try:
        response = model.complete(prompt=prompt)
        return sqlparse.format(str(response), reindent=True, keyword_case='upper')
    except Exception as e:
        logging.error(f"Error generating SQL: {e}")
        raise


@app.route('/generate_sql', methods=['POST'])
def generate_sql_endpoint():
    """API endpoint to generate SQL."""
    try:
        data = request.json
        schema = data.get("schema")
        question = data.get("question")
        model_name = data.get(
            "model_name", "mannix/defog-llama3-sqlcoder-8b:q8_0")

        if not schema or not question:
            return jsonify({"error": "Schema and question are required"}), 400

        model = Ollama(
            model=model_name,
            request_timeout=60.0,
            base_url="https://novel-holy-eft.ngrok-free.app/",
            temperature=0.0
        )

        sql_query = generate_sql(model, schema, question)
        return jsonify({"sql": sql_query, "result": "success"})

    except Exception as e:
        logging.error(f"Error in /generate_sql: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "API is running"})


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
