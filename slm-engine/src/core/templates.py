from llama_index.core import PromptTemplate

# TEXT_TO_SQL_TMPL_BK = """
# <|start_header_id|>user<|end_header_id|>
# Generate a SQL query to answer this question: `{question}`
# Instructions:
# {instructions}
# DDL statements:
# {create_table_statements}
# {insert_statements}
# {foreign_key_statements}<|eot_id|><|start_header_id|>assistant<|end_header_id>
# The following SQL query best answers the question `{question}`:
# ```sql
# """

# """ 
# ### Instructions:
# Your task is to convert a question into a SQL query, given a Postgres database schema.
# Adhere to these rules:
# - **Deliberately go through the question and database schema word by word** to appropriately answer the question
# - **Use Table Aliases** to prevent ambiguity. For example, `SELECT table1.col1, table2.col1 FROM table1 JOIN table2 ON table1.id = table2.id`.
# - When creating a ratio, always cast the numerator as float

# ### Input:
# Generate a SQL query that answers the question `{question}`.
# This query will run on a database whose schema is represented in this string:
# CREATE TABLE products (
#   product_id INTEGER PRIMARY KEY, -- Unique ID for each product
#   name VARCHAR(50), -- Name of the product
#   price DECIMAL(10,2), -- Price of each unit of the product
#   quantity INTEGER  -- Current quantity in stock
# );

# CREATE TABLE customers (
#    customer_id INTEGER PRIMARY KEY, -- Unique ID for each customer
#    name VARCHAR(50), -- Name of the customer
#    address VARCHAR(100) -- Mailing address of the customer
# );

# CREATE TABLE salespeople (
#   salesperson_id INTEGER PRIMARY KEY, -- Unique ID for each salesperson
#   name VARCHAR(50), -- Name of the salesperson
#   region VARCHAR(50) -- Geographic sales region
# );

# CREATE TABLE sales (
#   sale_id INTEGER PRIMARY KEY, -- Unique ID for each sale
#   product_id INTEGER, -- ID of product sold
#   customer_id INTEGER,  -- ID of customer who made purchase
#   salesperson_id INTEGER, -- ID of salesperson who made the sale
#   sale_date DATE, -- Date the sale occurred
#   quantity INTEGER -- Quantity of product sold
# );

# CREATE TABLE product_suppliers (
#   supplier_id INTEGER PRIMARY KEY, -- Unique ID for each supplier
#   product_id INTEGER, -- Product ID supplied
#   supply_price DECIMAL(10,2) -- Unit price charged by supplier
# );

# -- sales.product_id can be joined with products.product_id
# -- sales.customer_id can be joined with customers.customer_id
# -- sales.salesperson_id can be joined with salespeople.salesperson_id
# -- product_suppliers.product_id can be joined with products.product_id

# ### Response:
# Based on your instructions, here is the SQL query I have generated to answer the question `{question}`:
# ```sql
# """
# TEXT_TO_SQL_PROMPT_SQL_CODER = (
#     "### Instructions:\n"
#     "Your task is to convert a question into a {dialect} SQL query, given a {dialect} database schema.\n"
#     "Adhere to these rules:\n"
#     "- **Deliberately go through the question and database schema word by word** to appropriately answer the question\n"
#     "- **Use Table Aliases** to prevent ambiguity. For example, `SELECT table1.col1, table2.col1 FROM table1 JOIN table2 ON table1.id = table2.id`.\n"
#     "- When creating a ratio, always cast the numerator as float\n"
#     "\n"
#     "### Input:\n"
#     "Generate a {dialect} SQL query that answers the question `{user_question}`.\n"
#     "This query will run on a database whose schema is represented in this string:\n"
#     "{table_schemas}\n"
#     "\n"
#     "### Response:\n"
#     "Based on your instructions, here is the {dialect} SQL query I have generated to answer the question `{question}`:\n"
#     "```sql\n"
# )

SCHEMA_ENRICHMENT_PROMPT = (
    "# Task: Analyze database schema semantics\n\n"
    "## Schema Information:\n"
    "Database context: {db_info}\n\n"
    "Tables and columns:\n"
    "{cluster_info}\n\n"
    "## Instructions:\n"
    "1. Analyze each table and column's semantic purpose\n"
    "2. Use brief and clear semantic descriptions for each table and column\n"
    "3. Format as JSON exactly as shown below\n\n"
    "## Response Format:\n"
    "```json\n"
    "[\n"
    "  {{\"table_name\": \"TABLE1\", \"description\": \"brief table purpose\", \"columns\": [\n"
    "    {{\"column_name\": \"COLUMN1\", \"description\": \"brief column purpose\"}},\n"
    "    {{\"column_name\": \"COLUMN2\", \"description\": \"brief column purpose\"}}\n"
    "  ]}},\n"
    "  {{\"table_name\": \"TABLE2\", \"description\": \"brief table purpose\", \"columns\": [\n"
    "    {{\"column_name\": \"COLUMN1\", \"description\": \"brief column purpose\"}}\n"
    "  ]}}\n"
    "]\n"
    "```\n\n"
    "Return only the JSON output with no additional text."
)
SCHEMA_ENRICHMENT_TMPL = PromptTemplate(SCHEMA_ENRICHMENT_PROMPT)

DATABASE_DESCRIPTION_PROMPT = (
    "You are a knowledgeable database schema analyst. Given a database schema consisting of table definitions, "
    "your task is to generate a concise description of the database.\n\n"
    "Database schema:\n"
    "{schema}\n\n"
    "Instructions:\n"
    "1. Analyze the table and column names to infer the purpose of each table.\n"
    "2. Identify any potential relationships between tables (e.g., shared column names, foreign key patterns).\n"
    "3. Summarize the overall purpose of the database in 2 to 4 clear sentences.\n"
    "4. Do not repeat the schema or include headings or bullet points.\n"
    "5. Write only the brief description, as if explaining the database's purpose to a technical stakeholder.\n\n"
    "Database description:\n"
)
DATABASE_DESCRIPTION_TMPL = PromptTemplate(DATABASE_DESCRIPTION_PROMPT)


TEXT_TO_SQL_PROMPT = (
    "You are a {dialect} SQL expert. Generate a SQL query based on the user's question. Only return the SQL query, no explanations.\n\n"
    "Database description: {database_description}\n\n"
    "Available tables and their schema:\n"
    "{table_schemas}\n\n"
    "Requirements:\n"
    "1. Write a precise SQL query that answers the user's question exactly\n"
    "2. Use only the tables and columns provided above\n"
    "3. Follow standard SQL syntax compatible with {dialect}\n"
    "4. Include proper JOINs when data needs to be combined from multiple tables\n"
    "5. Use appropriate aggregation functions (COUNT, SUM, AVG, etc.) when needed\n"
    "6. Ensure your query is efficient and follows best practices\n"
    "7. Return ONLY the SQL query WITHOUT any additional text, comments, or explanations\n"
    "8. If you can't answer the question with the given tables, return \"Cannot generate SQL with available schema\"\n"
    "9. Use Table Aliases to prevent ambiguity. For example, `SELECT table1.col1, table2.col1 FROM table1 JOIN table2 ON table1.id = table2.id`\n\n"
    "User question: `{user_question}`\n"
    "SQL query:\n"
)

TEXT_TO_SQL_PROMPT_FINETUNED = (
    "-- Database description: {database_description}\n\n"
    "{table_schemas}\n"
    "-- Using valid {dialect} SQL, answer the following questions for the tables provided above.\n"
    "Question: {user_question}\n"
)

TEXT_TO_SQL_PROMPT_SQLCODER = (
    "### Instructions:\n"
    "Your task is to convert a question into a SQL query, given a {dialect} database schema.\n"
    "Adhere to these rules:\n"
    "- **Deliberately go through the question and database schema word by word** to appropriately answer the question\n"
    "- **Use Table Aliases** to prevent ambiguity. For example, `SELECT table1.col1, table2.col1 FROM table1 JOIN table2 ON table1.id = table2.id`.\n"
    "- **Database Description:** {database_description}\n"
    "- When creating a ratio, always cast the numerator as float\n"
    "\n"
    "### Input:\n"
    "Generate a SQL query that answers the question `{user_question}`.\n"
    "This query will run on a database whose schema is represented in this string:\n"
    "{table_schemas}\n"
    "\n"
    "### Response:\n"
    "Based on your instructions, here is the SQL query I have generated to answer the question `{user_question}`:\n"
    "```sql\n"
)

def text2sql_prompt_routing(prompt_type: int) -> PromptTemplate:
    if prompt_type == 0:
        prompt = TEXT_TO_SQL_PROMPT
    elif prompt_type == 1:
        prompt = TEXT_TO_SQL_PROMPT_FINETUNED
    elif prompt_type == 2:
        prompt = TEXT_TO_SQL_PROMPT_SQLCODER
    else:
        raise ValueError("Invalid prompt type")
    
    return PromptTemplate(prompt)




TABLE_RETRIEVAL_PROMPT = (
    "Return ONLY the names of SQL tables that MIGHT be relevant to the user question.\n"
    "The question is: {user_question}\n"
    "The database description is: {database_description}\n"
    "The tables are as following format - [table_name (table_description)]:\n\n"
    "{table_names}\n\n"
    "Instructions:\n"
    "1. Include ALL POTENTIALLY RELEVANT tables, even if you're not sure that they're needed.\n"
    "2. Return ONLY a Python list of table names in the format: ['table_name1', 'table_name2', 'table_name3']\n"
    "3. Do not include any explanations, additional text, or markdown formatting.\n"
    "4. If no tables are relevant, return an empty list: []\n"
    "5. Make sure your response can be directly parsed as a Python list.\n"
)
TABLE_RETRIEVAL_PROMPT = """
    As an experienced and professional database administrator, your task is to analyze a user question and a database schema to identify potentially relevant tables for SQL query generation. The database schema consists of multiple tables, each with detailed column descriptions. Your goal is to select the tables that are likely relevant to answering the user’s question based on the provided schema.
    
    Instructions:
    1. Consider every table and column described in the database schema. Look for the ones that might help answer the user question.
    2. Include ALL tables that might be relevant based on the question, even if you're not entirely sure of their exact usage.
    3. Return a Python list of table names that could be helpful, using this format: ['table_name1', 'table_name2', 'table_name3'].
    4. Do NOT include any explanations, comments, or markdown formatting in your response.
    5. If no tables are relevant, return an empty list: [].
    6. Ensure that your response is a plain Python list that can be directly parsed for SQL query generation.
    
    Database Description: "{database_description}"

    Database Schema:
    {database_schema}

    User Question: "{user_question}"

    Answer:
"""
TABLE_RETRIEVAL_PROMPT = (
    "As an experienced and professional database administrator, your task is to analyze a user question and a database schema to identify potentially relevant tables for SQL query generation. The database schema consists of multiple tables, each with detailed column descriptions. Your goal is to select the tables that are likely relevant to answering the user’s question based on the provided schema.\n\n"
    "Instructions:\n"
    "1. Consider every table and column described in the database schema. Look for the ones that might help answer the user question.\n"
    "2. Include ALL tables that might be relevant based on the question, even if you're not entirely sure of their exact usage.\n"
    "3. Return a Python list of table names in the format: ['table1', 'table2', 'table3'].\n"
    "4. Do NOT include any explanations, comments, or markdown formatting in your response.\n"
    "5. If no tables are relevant, return an empty list: [].\n"
    "6. Ensure that your response is a plain Python list that can be directly parsed as a Python list.\n\n"
    "Database Description: \"{database_description}\"\n\n"
    "Database Schema:\n"
    "{database_schema}\n\n"
    "User Question: \"{user_question}\"\n"
    "List of table names in the format - ['table1', 'table2', 'table3'] that resulted from a question, even if you're not entirely sure of their exact usage: \n"
)
TABLE_RETRIEVAL_TMPL = PromptTemplate(TABLE_RETRIEVAL_PROMPT)

# TABLE_EXTRACTION_PROMPT = (
#     "You are a {dialect} SQL expert. Extract all tables referenced in the SQL query and return them as a Python list.\n"
#     "SQL query: {sql_query}\n"
#     "Requirements:\n"
#     "1. Identify ALL tables referenced in the query\n"
#     "2. Include tables from FROM clauses, JOIN statements, subqueries, and CTEs\n"
#     "3. Return ONLY a valid Python list of table names as strings\n"
#     "4. Format the response exactly as: [\"table1\", \"table2\", \"table3\"]\n"
#     "5. Return an empty list [] if no tables are found\n"
#     "6. Do not include any explanations, comments, or additional text\n"
#     "7. Ensure table names are extracted exactly as they appear in the query\n"
#     "8. If table has an alias, only include the original table name, not the alias\n"
#     "Python list of tables:\n"
# )
# TABLE_EXTRACTION_TMPL = PromptTemplate(TABLE_EXTRACTION_PROMPT)

SQL_ERROR_REFLECTION_PROMPT = (
    "You are a {dialect} SQL expert. Reflect on the given SQL query and error message to determine the cause of the error and suggest a possible solution.\n\n"
    "### User query: {user_query}\n"
    "### Database description: {database_description}\n"
    "### Database schema: \n{database_schema}\n"
    "### Original SQL query: {sql_query}\n"
    "### Error message: {error_message}\n\n"
    "Requirements:\n"
    "1. Analyze the error and determine the cause\n"
    "2. Fix the SQL query to resolve the error\n"
    "3. Ensure compatibility with the database schema provided\n"
    "4. Return ONLY the corrected SQL query with no explanations or comments\n"
    "5. Maintain the original query's intent while fixing the syntax or logical errors\n"
    "6. Follow standard SQL syntax compatible with the database type\n"
    "7. If the query cannot be fixed with the given information, return a simplified valid query\n"
    "8. Do not include any text before or after the SQL query\n"
    "Corrected SQL query without explanations:\n"
)
SQL_ERROR_REFLECTION_TMPL = PromptTemplate(SQL_ERROR_REFLECTION_PROMPT)


SEMANTIC_ROWS_TMPL = """
INSERT INTO {table_name}({columns})\nVALUES \n{values};
"""


SEMANTIC_HELPER_TMPL = """
< | start_header_id | >user < |end_header_id | >
Follow instructions to the letter, and answer questions without making any additional assumptions. Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

# Instruction: This represents the {dialect} SQL query that has been generated in response to the given question, along with the resulting outcome after executing the query.
1. Please judge its correctness based on the execution result and the explanation for the question.
2. If the results contain multi NULL/empty or repeat values, the SQL query may be incorrect.
3. Pay attention to the meaning relationship between execution result and the question.
4. Make sure the execution result is consistent and provide a meaningful explanation for the question.

If it's incorrect, output the correct {dialect} SQL query; otherwise, output the original {dialect} SQL query.

# DDL statements:
{semantic_schema}
< | eot_id | > < |start_header_id | >assistant < |end_header_id | >
With the previous context and provided information:
- SQL query: {sql}
- Run results dataframe:
{sql_result}
The following SQL query has been generated in response to the given question `{question}`:
```sql
"""

SQL_REFLECTION_TMPL = """
< | start_header_id | >user < |end_header_id | >
Here is a {dialect} SQL query that resulted from a question, but it produced an error when
executed. What do you think is the possible reason for this SQL error?

DDL statements:
{semantic_schema}
< | eot_id | > < |start_header_id | >assistant < |end_header_id | >
With the previous sql execution logs for the given question `{question}`:
{previous_logs}

With current SQL query:
- Buggy SQL Query: {sql}
- Error: {error}

The following reason best explains the error in the SQL query with the given question `{question}`:
Error Reason:
"""

SQL_FIXER_TMPL = """
< | start_header_id | >user < |end_header_id | >
Here is a {dialect} SQL query that resulted from a question, but it produced an error when
executed. Please correct it with no explanation.

DDL statements:
{semantic_schema}
< | eot_id | > < |start_header_id | >assistant < |end_header_id | >
With the previous sql execution logs for the given question `{question}`:
{previous_logs}

With current SQL query:
- SQL query: {sql}
- Error: {error}
- Error Reason: {error_reason}

The following corected sql query has been generated in response to the given question `{question}`:
```sql
"""


SQL_EXECUTION_LOG_TMPL = """
### {no_attempt} attempt ###
# SQL: {sql}
# Error: {error}
# Error Reason: {reason}
# New SQL: {new_sql}
"""

TEXT_TO_VIZ_CODE_TMPL = """
< | start_header_id | >user < |end_header_id | >
You are a helpful code assistant. Complete the Python code snippet below following the instructions. Follow instructions to the letter, and answer questions without making any additional assumptions. Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request in python snippet.s

# Instructions:
1. Pay attention to Vietnamese input and output.
2. Complete below Python code snippet to generate a ** *{type}*** visualization chart based on the given DataFrame which provided in the code snippet.


< | eot_id | > < |start_header_id | >assistant < |end_header_id | >
The following python code snippet best answers for `{question}` follows the instructions:
```python
{code_snippet}
"""

VISUAL_SUGGESTION_PROMPT_TMPL = """
< | start_header_id | >user < |end_header_id | >
You are an AI assistant that recommends appropriate data visualizations. Based on the user's question, SQL query, and query results, suggest the most suitable type of graph or chart to visualize the data. If no visualization is appropriate, indicate that.

Available chart types and their use cases:
- Bar Graphs: Best for comparing categorical data or showing changes over time when categories are discrete and the number of categories is more than 2. Use for questions like "What are the sales figures for each product?" or "How does the population of cities compare? or "What percentage of each city is male?"
- Horizontal Bar Graphs: Best for comparing categorical data or showing changes over time when the number of categories is small or the disparity between categories is large. Use for questions like "Show the revenue of A and B?" or "How does the population of 2 cities compare?" or "How many men and women got promoted?" or "What percentage of men and what percentage of women got promoted?" when the disparity between categories is large.
- Scatter Plots: Useful for identifying relationships or correlations between two numerical variables or plotting distributions of data. Best used when both x axis and y axis are continuous. Use for questions like "Plot a distribution of the fares (where the x axis is the fare and the y axis is the count of people who paid that fare)" or "Is there a relationship between advertising spend and sales?" or "How do height and weight correlate in the dataset? Do not use it for questions that do not have a continuous x axis."
- Pie Charts: Ideal for showing proportions or percentages within a whole. Use for questions like "What is the market share distribution among different companies?" or "What percentage of the total revenue comes from each product?"
- Line Graphs: Best for showing trends and distributionsover time. Best used when both x axis and y axis are continuous. Used for questions like "How have website visits changed over the year?" or "What is the trend in temperature over the past decade?". Do not use it for questions that do not have a continuous x axis or a time based x axis.

Consider these types of questions when recommending a visualization:
1. Aggregations and Summarizations(e.g., "What is the average revenue by month?" - Line Graph)
2. Comparisons(e.g., "Compare the sales figures of Product A and Product B over the last year." - Line or Column Graph)
3. Plotting Distributions(e.g., "Plot a distribution of the age of users" - Scatter Plot)
4. Trends Over Time(e.g., "What is the trend in the number of active users over the past year?" - Line Graph)
5. Proportions(e.g., "What is the market share of the products?" - Pie Chart)
6. Correlations(e.g., "Is there a correlation between marketing spend and revenue?" - Scatter Plot)

Provide your response in the following format(each taking the form of a single line):
Recommended Visualization: [Chart type or "None"]. ONLY use the following names: bar, horizontal_bar, line, pie, scatter, none
Reason: [Brief explanation for your recommendation]
< | eot_id | > < |start_header_id | >assistant < |end_header_id | >
With the provided information:
- SQL query: {sql}
- SQL Execution result dataframe(first 20 rows):
{results}
... (additional rows are available in the data)

The following visualize recommendation best answers the question `{question}`:
Recommend a visualization:
"""

DATAFRAME_LABEL_TMPL = """
< | start_header_id | >user < |end_header_id | >
You are a data labeling expert. Given a question and some data, provide a concise and relevant label for the data series.
Based on the user's question and dataframe, label the data series to help users understand the data better.

# Instructions:
1. Remember to consider the context of the question and the data provided when labeling the data series.
2. Consider the following when labeling the data series:
For example, if the data is the sales figures over time, the label could be 'Sales'. If the data is the population growth, the label could be 'Population'. If the data is the revenue trend, the label could be 'Revenue'.
3. Pay attention to the data series and the question to provide a relevant label.
4. Pay attention to Vietnamese input and output. All labels must be in Vietnamese.

If its labels are not best suited for the data and question, output the new appropriate labels; otherwise, output the original labels as new labels.

Provide your response in the following format:
New labels mapping:
{{
    'Data Series 1 - Original label': 'New Label 1',
    'Data Series 2 - Original label': 'New Label 2',
    ...
}}
**Note: The new labels should be in the same order as the data series and include all data series.**
< | eot_id | > < |start_header_id | >assistant < |end_header_id | >
with the provided information:
- Question: {question}
- Original labels: {original_labels}
- Dataframe:
{dataframe}
- Chart Type: {chart_type}

The following Vietnamese labels best answer the question `{question}`:
New labels mapping:
"""
