import ast
import re
from llama_index.core.llms import ChatResponse


def extract_table_list(response: ChatResponse) -> list:
    """Extracts a list of table names from a ChatResponse object."""
    response = response.message.content
    try:
        # Cố gắng parse trực tiếp nếu đã định dạng chính xác
        return ast.literal_eval(response.strip())
    except:  # noqa: E722
        # Fallback: tìm kiếm các chuỗi trong dấu ngoặc đơn
        pattern = r"'([^']+)'"
        matches = re.findall(pattern, response)
        if matches:
            return matches
        # Nếu không có matches, cố gắng tách theo dấu phẩy
        return [item.strip().strip("'\"") for item in response.split(',') if item.strip()]


def schema_parser(tables: list, type: str):
    if type not in ["DDL", "Synthesis"]:
        raise Exception("Invalid schema parser type. Must be 'DDL' or 'Synthesis'.")

    if type == "DDL":
        ddl_statements = []
        for table in tables:
            table_name = table["tableIdentifier"]
            columns = table["columns"]

            # Create table definition
            column_definitions = []
            for column in columns:
                column_def = f"{column['columnIdentifier']} {column['columnType']}"
                description = column.get("columnDescription", None)
                if description:
                    # Add description as a comment before the comma
                    column_def += f", -- {description}"
                else:
                    column_def += ","
                column_definitions.append(column_def)

            # Combine into CREATE TABLE statement (no constraints)
            ddl = f"CREATE TABLE {table_name} (\n    " + \
                "\n    ".join(column_definitions) + "\n);"
            ddl_statements.append(ddl)

        return "\n\n".join(ddl_statements)

    elif type == "Synthesis":
        synthesis_statements = []
        for table in tables:
            table_name = table["tableIdentifier"]
            columns = table["columns"]

            # Generate synthesis description
            column_descriptions = []
            for column in columns:
                description = column.get(
                    "columnDescription", "No description available")
                column_descriptions.append(
                    f"{column['columnIdentifier']} ({column['columnType']}): {description}")

            synthesis = f"Table: {table_name}\nColumns:\n    " + \
                "\n    ".join(column_descriptions)
            synthesis_statements.append(synthesis)

        return "\n\n".join(synthesis_statements)


def show_prompt(prompt_messages):
    """
    Displays the formatted prompt messages in a readable format.

    Args:
        prompt_messages (list): A list of ChatMessage objects containing the prompt.
    """
    print("\nFormatted Prompt Messages:")
    print("-" * 80)
    for message in prompt_messages:
        print(f"Role: {message.role}")
        for block in message.blocks:
            if block.block_type == "text":
                print(f"Content:\n{block.text}")
        print("-" * 80)  # Separator for readability


def extract_sql_query(response_text):
        """
        Extract SQL query from LLM response and return as a single line.
        
        Args:
            response_text: The LLM response text that may contain a SQL query
            
        Returns:
            A single line SQL query without any additional elements
        """
        # Try to extract code blocks with sql, SQL, or no language specified
        sql_pattern = r"```(?:sql|SQL)?\s*([\s\S]*?)```"
        sql_matches = re.findall(sql_pattern, response_text)
        
        if sql_matches:
            # Take the first match if multiple code blocks
            sql = sql_matches[0].strip()
        else:
            # If no code blocks with ``` are found, try to extract the full query differently
            
            # First attempt: look for complete queries with nested subqueries and proper formatting
            # This complex pattern captures SQL with nested parentheses, conditions, etc.
            complex_sql_pattern = r"SELECT[\s\S]+?FROM[\s\S]+?(?:WHERE[\s\S]+?)?(?:GROUP BY[\s\S]+?)?(?:HAVING[\s\S]+?)?(?:ORDER BY[\s\S]+?)?(?:LIMIT\s+\d+)?(?:OFFSET\s+\d+)?(?:;|$)"
            complex_matches = re.findall(complex_sql_pattern, response_text, re.IGNORECASE)
            
            if complex_matches:
                sql = complex_matches[0].strip()
            else:
                # Second attempt: try to find a complete SQL statement with semicolon
                semicolon_pattern = r"SELECT[\s\S]+?;|INSERT[\s\S]+?;|UPDATE[\s\S]+?;|DELETE[\s\S]+?;|CREATE[\s\S]+?;|DROP[\s\S]+?;|ALTER[\s\S]+?;"
                semicolon_matches = re.findall(semicolon_pattern, response_text, re.DOTALL | re.IGNORECASE)
                
                if semicolon_matches:
                    # Take the first complete SQL statement with semicolon
                    sql = semicolon_matches[0].strip()
                else:
                    # Try a simple approach - collect all lines between SELECT and the end of the query
                    lines = response_text.split('\n')
                    sql_lines = []
                    in_sql = False
                    
                    for line in lines:
                        # Start collecting when we see SELECT
                        if re.search(r'\bSELECT\b', line, re.IGNORECASE) and not in_sql:
                            in_sql = True
                            sql_lines.append(line)
                        # Continue collecting if we're in SQL mode
                        elif in_sql:
                            # Stop if we hit an empty line after collecting some SQL or see end markers
                            if (not line.strip() and len(sql_lines) > 3) or re.search(r'\bEXPLAIN\b|\bANALYZE\b', line, re.IGNORECASE):
                                break
                            sql_lines.append(line)
                    
                    if sql_lines:
                        sql = '\n'.join(sql_lines)
                    else:
                        # If all else fails, fall back to keyword search
                        sql_keywords = r"(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|DESCRIBE)"
                        potential_sql_lines = re.findall(fr"(?m)^.*{sql_keywords}.*$", response_text)
                        
                        if potential_sql_lines:
                            # Join potential SQL lines
                            sql = " ".join(line.strip() for line in potential_sql_lines)
                        else:
                            # If nothing looks like SQL, return a default query
                            print("No valid SQL query found in the response, returning default query.")
                            return "SELECT 0;"
        
        # Fix incomplete queries by checking for missing parts
        # 1. Is the query missing column parts?
        if "SELECT" in sql.upper() and "FROM" in sql.upper():
            # Extract SELECT part
            select_match = re.search(r'SELECT\s+(.*?)(?:\s+FROM)', sql, re.IGNORECASE | re.DOTALL)
            
            if select_match:
                select_columns = select_match.group(1).strip()
                
                # If SELECT part seems truncated (e.g., missing commas between selections)
                if ',' in select_columns and select_columns.count(',') < response_text.count(',') and select_columns.endswith(','):
                    # Try to find all selected columns from the original text
                    select_pattern = r'SELECT\s+(.*?)\s+FROM'
                    select_full_match = re.search(select_pattern, response_text, re.IGNORECASE | re.DOTALL)
                    
                    if select_full_match and len(select_full_match.group(1)) > len(select_columns):
                        # Replace only the SELECT part with the better match
                        sql = sql.replace(select_columns, select_full_match.group(1).strip())
        
        # Handle missing parts of the query by parsing the structure and ensuring completeness
        sql_upper = sql.upper()
        
        # Check if we're missing FROM in a SELECT query
        if "SELECT" in sql_upper and "FROM" not in sql_upper:
            from_pattern = r'FROM\s+\w+(?:\s+AS\s+\w+)?'
            from_match = re.search(from_pattern, response_text, re.IGNORECASE)
            
            if from_match:
                sql += " " + from_match.group(0)
        
        # Check if we're missing WHERE in a query that should have it
        if "WHERE" not in sql_upper and "WHERE" in response_text.upper():
            # Find the WHERE clause including any complex conditions and nested queries
            where_pattern = r'WHERE\s+[\s\S]+?(?:GROUP BY|ORDER BY|LIMIT|HAVING|;|$)'
            where_match = re.search(where_pattern, response_text, re.IGNORECASE)
            
            if where_match:
                where_clause = where_match.group(0)
                # Remove anything after the actual WHERE clause
                for ending in ["GROUP BY", "ORDER BY", "LIMIT", "HAVING", ";"]:
                    if ending in where_clause.upper():
                        where_clause = where_clause[:where_clause.upper().find(ending)]
                        break
                
                sql += " " + where_clause.strip()
        
        # Handle subqueries by ensuring complete parentheses balance
        # Count opening and closing parentheses
        open_parens = sql.count('(')
        close_parens = sql.count(')')
        
        # If unbalanced, check original text for the complete subquery
        if open_parens > close_parens:
            # Find the point where we're missing closing parentheses
            for i in range(close_parens, open_parens):
                subquery_pattern = r'\([^()]*(?:\([^()]*\)[^()]*)*\)'  # Match balanced parentheses
                
                # Search for subqueries in the original text that might be missing
                subquery_candidates = re.findall(subquery_pattern, response_text)
                for candidate in subquery_candidates:
                    if candidate not in sql:
                        # We found a subquery that's missing from our extracted SQL
                        # Try to find where it fits
                        opening_pos = -1
                        for j, char in enumerate(sql):
                            if char == '(':
                                opening_pos = j
                                # Check if this is already balanced
                                if sql[j:].count('(') <= sql[j:].count(')'):
                                    continue
                                # Check if this opening might be part of our missing subquery
                                subquery_starts = candidate.find('(')
                                if subquery_starts == 0 and sql[j:j+10] in candidate[:10]:
                                    # This position looks like where our missing subquery fits
                                    sql = sql[:j] + candidate + sql[j+1:]
                                    break
        
        # Ensure all lines of a multi-line SQL statement are included
        if "SELECT" in sql.upper() and sql.strip().startswith("SELECT"):
            # Check if we're potentially missing parts of the query by comparing with original text
            sql_keywords = ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"]
            present_keywords = [kw for kw in sql_keywords if kw in sql.upper()]
            
            # Find all occurrences of these keywords in the original text
            for i, keyword in enumerate(present_keywords):
                # Check if there should be something between this keyword and the next one
                if i < len(present_keywords) - 1:
                    current_pos = sql.upper().find(keyword)
                    next_pos = sql.upper().find(present_keywords[i+1])
                    
                    if current_pos >= 0 and next_pos >= 0:
                        # Extract what's between these keywords in our current SQL
                        current_content = sql[current_pos + len(keyword):next_pos].strip()
                        
                        # Find the same section in original text
                        orig_current_pos = response_text.upper().find(keyword)
                        orig_next_pos = response_text.upper().find(present_keywords[i+1])
                        
                        if orig_current_pos >= 0 and orig_next_pos >= 0:
                            orig_content = response_text[orig_current_pos + len(keyword):orig_next_pos].strip()
                            
                            # If original has more content, use it instead
                            if len(orig_content) > len(current_content) and not orig_content.startswith(current_content):
                                # Replace the section with the more complete version
                                sql = sql[:current_pos + len(keyword)] + " " + orig_content + " " + sql[next_pos:]
        
        # Clean up the final SQL statement
        sql = re.sub(r'\s+', ' ', sql).strip()
        
        # Try to grab any columns that might still be missing (check for S.Song_release_year pattern)
        if "SELECT" in sql.upper() and "FROM" in sql.upper():
            match = re.search(r'SELECT\s+(.*?)\s+FROM', sql, re.IGNORECASE | re.DOTALL)
            if match:
                select_part = match.group(1)
                # Check if the SELECT part appears truncated
                if "," in select_part and select_part.count(",") < response_text.count(","):
                    # Look for column patterns that might be missing
                    column_pattern = r'(?:[A-Za-z]\w*\.)?[A-Za-z]\w*(?:\s+AS\s+\w+)?'
                    original_columns = re.findall(column_pattern, response_text)
                    for col in original_columns:
                        # Check if it looks like a column reference but isn't in our SELECT
                        if '.' in col and col not in select_part:
                            # If it's not in a different part of the query (WHERE, etc.)
                            if col not in sql[sql.upper().find("FROM"):]:
                                select_part += f", {col}"
                    
                    # Update the SQL with the more complete SELECT part
                    sql = sql.replace(match.group(1), select_part)
        
        # If the result is empty or obviously not SQL, return the default
        if not sql or not any(keyword in sql.upper() for keyword in ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE"]):
            print("Extracted content doesn't appear to be a valid SQL query, returning default query.")
            return "SELECT 0;"
            
        return sql
