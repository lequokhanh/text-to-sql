SEMANTIC_ROWS_TMPL = """
INSERT INTO {table_name} ({columns})\nVALUES \n{values};
"""

TEXT_TO_SQL_TMPL = """
<|start_header_id|>user<|end_header_id|>
Generate a SQL query to answer this question: `{question}`
Instructions:
{instructions}
DDL statements:
{create_table_statements}
{insert_statements}
{foreign_key_statements}<|eot_id|><|start_header_id|>assistant<|end_header_id>
The following SQL query best answers the question `{question}`:
```sql
"""


SEMANTIC_HELPER_TMPL = """
<|start_header_id|>user<|end_header_id|>
Follow instructions to the letter, and answer questions without making any additional assumptions. Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction: This represents the {dialect} SQL query that has been generated in response to the given question, along with the resulting outcome after executing the query.
1. Please judge its correctness based on the execution result and the explanation for the question.
2. If the results contain multi NULL/empty or repeat values, the SQL query may be incorrect.
3. Pay attention to the meaning relationship between execution result and the question. 
4. Make sure the execution result is consistent and provide a meaningful explanation for the question.

If it's incorrect, output the correct {dialect} SQL query; otherwise, output the original {dialect} SQL query.

### DDL statements:
{semantic_schema}
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
With the previous context and provided information:
- SQL query: {sql}
- Run results dataframe:
{sql_result}
The following SQL query has been generated in response to the given question `{question}`:
```sql
"""

SQL_REFLECTION_TMPL = """
<|start_header_id|>user<|end_header_id|>
Here is a {dialect} SQL query that resulted from a question, but it produced an error when
executed. What do you think is the possible reason for this SQL error?

DDL statements:
{semantic_schema}
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
With the previous sql execution logs for the given question `{question}`:
{previous_logs}

With current SQL query:
- Buggy SQL Query: {sql}
- Error: {error}

The following reason best explains the error in the SQL query with the given question `{question}`:
Error Reason:
"""

SQL_FIXER_TMPL = """
<|start_header_id|>user<|end_header_id|>
Here is a {dialect} SQL query that resulted from a question, but it produced an error when
executed. Please correct it with no explanation.

DDL statements:
{semantic_schema}
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
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
### SQL: {sql}
### Error: {error}
### Error Reason: {reason}
### New SQL: {new_sql}
"""

TEXT_TO_VIZ_CODE_TMPL = """
<|start_header_id|>user<|end_header_id|>
You are a helpful code assistant. Complete the Python code snippet below following the instructions. Follow instructions to the letter, and answer questions without making any additional assumptions. Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request in python snippet.s

### Instructions:
1. Pay attention to Vietnamese input and output.
2. Complete below Python code snippet to generate a ***{type}*** visualization chart based on the given DataFrame which provided in the code snippet.


<|eot_id|><|start_header_id|>assistant<|end_header_id|>
The following python code snippet best answers for `{question}` follows the instructions:
```python
{code_snippet}
"""

VISUAL_SUGGESTION_PROMPT_TMPL = """
<|start_header_id|>user<|end_header_id|>
You are an AI assistant that recommends appropriate data visualizations. Based on the user's question, SQL query, and query results, suggest the most suitable type of graph or chart to visualize the data. If no visualization is appropriate, indicate that.

Available chart types and their use cases:
- Bar Graphs: Best for comparing categorical data or showing changes over time when categories are discrete and the number of categories is more than 2. Use for questions like "What are the sales figures for each product?" or "How does the population of cities compare? or "What percentage of each city is male?"
- Horizontal Bar Graphs: Best for comparing categorical data or showing changes over time when the number of categories is small or the disparity between categories is large. Use for questions like "Show the revenue of A and B?" or "How does the population of 2 cities compare?" or "How many men and women got promoted?" or "What percentage of men and what percentage of women got promoted?" when the disparity between categories is large.
- Scatter Plots: Useful for identifying relationships or correlations between two numerical variables or plotting distributions of data. Best used when both x axis and y axis are continuous. Use for questions like "Plot a distribution of the fares (where the x axis is the fare and the y axis is the count of people who paid that fare)" or "Is there a relationship between advertising spend and sales?" or "How do height and weight correlate in the dataset? Do not use it for questions that do not have a continuous x axis."
- Pie Charts: Ideal for showing proportions or percentages within a whole. Use for questions like "What is the market share distribution among different companies?" or "What percentage of the total revenue comes from each product?"
- Line Graphs: Best for showing trends and distributionsover time. Best used when both x axis and y axis are continuous. Used for questions like "How have website visits changed over the year?" or "What is the trend in temperature over the past decade?". Do not use it for questions that do not have a continuous x axis or a time based x axis.

Consider these types of questions when recommending a visualization:
1. Aggregations and Summarizations (e.g., "What is the average revenue by month?" - Line Graph)
2. Comparisons (e.g., "Compare the sales figures of Product A and Product B over the last year." - Line or Column Graph)
3. Plotting Distributions (e.g., "Plot a distribution of the age of users" - Scatter Plot)
4. Trends Over Time (e.g., "What is the trend in the number of active users over the past year?" - Line Graph)
5. Proportions (e.g., "What is the market share of the products?" - Pie Chart)
6. Correlations (e.g., "Is there a correlation between marketing spend and revenue?" - Scatter Plot)

Provide your response in the following format (each taking the form of a single line):
Recommended Visualization: [Chart type or "None"]. ONLY use the following names: bar, horizontal_bar, line, pie, scatter, none
Reason: [Brief explanation for your recommendation]
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
With the provided information:
- SQL query: {sql}
- SQL Execution result dataframe (first 20 rows):
{results}
... (additional rows are available in the data)

The following visualize recommendation best answers the question `{question}`:
Recommend a visualization:
"""

DATAFRAME_LABEL_TMPL = """
<|start_header_id|>user<|end_header_id|>
You are a data labeling expert. Given a question and some data, provide a concise and relevant label for the data series. 
Based on the user's question and dataframe, label the data series to help users understand the data better.

### Instructions:
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
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
with the provided information:
- Question: {question}
- Original labels: {original_labels}
- Dataframe:
{dataframe}
- Chart Type: {chart_type}

The following Vietnamese labels best answer the question `{question}`:
New labels mapping:
"""
