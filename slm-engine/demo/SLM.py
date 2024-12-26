from llama_index.llms.ollama import Ollama
import sqlparse
import json
import os


def DDL(schema):
    column_template = """{name} {dtype} {primary_key}, //{description}"""
    table_template = """CREATE TABLE {table_name} (
    {columns}
);
    """
    tables = []
    for table in schema["tables"]:
        for column in table["columns"]:
            column["primary_key"] = "PRIMARY KEY" if column["name"] in table["primary_keys"] else ""

        columns = "\n    ".join([column_template.format(
            **column) for column in table["columns"]])
        table = table_template.format(
            table_name=table["name"], columns=columns)
        tables.append(table)

    return tables


def load_template(model_name):
    model_file_name = model_name.replace("/", "_").replace(":", "_")
    for prompt_file in os.listdir("prompt_hub"):
        if model_file_name in prompt_file:
            _path = os.path.join("prompt_hub", prompt_file)
            print("Loading prompt from " + _path)
            with open(_path, "r") as file:
                return file.read()
    print(f"File {model_file_name} not found")
    return None


def ask_sql(model: Ollama, database_schema: dict, question: str):
    prompt_template = load_template(model.model)
    prompt = prompt_template.format(
        user_question=question,
        instructions="",
        create_table_statements="\n".join(DDL(database_schema))
    )
    print("\nPrompt: \n" + "\033[92m" + prompt + "\033[0m")
    try:
        response = model.complete(prompt=prompt)

        return response
    except Exception as e:
        print(e)


def main():
    schema = json.load(open("template.json", encoding="utf-8"))
    llm = Ollama(model="mannix/defog-llama3-sqlcoder-8b:q8_0",
                 request_timeout=60.0, base_url="https://novel-holy-eft.ngrok-free.app/", temperature=0.0)
    # slm = Ollama(model="anindya/prem1b-sql-ollama-fp116", request_timeout=60.0,
    #              temperature=0.0, additional_kwargs={"num_ctx": 2048 + 256})

    question = "What is the name of the department with the highest number of employees?"
    print("\nQuestion: " + question)
    response = ask_sql(llm, schema, question)
    print("\nSQL: \n" + sqlparse.format(str(response),
          reindent=True, keyword_case='upper'))


if __name__ == "__main__":
    main()
