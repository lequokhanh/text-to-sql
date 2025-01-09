import streamlit as st
import requests
import json
import os

# Constants for API endpoints
DB_CONNECT_API = "http://localhost:8181/db/connect"
GENERATE_SQL_API = "http://localhost:5000/generate_sql"
LOCAL_SCHEMA_FILE = "database_schema.json"

# Page 1: Connect Data Source


def connect_data_source():
    st.title("Connect Data Source")

    st.subheader("Enter Database Connection Details")
    db_type = st.selectbox("Database Type", ["postgresql", "mysql"])
    db_host = st.text_input("Host", value="host.docker.internal")
    db_port = st.text_input("Port", value="5432")
    db_name = st.text_input("Database Name", value="world-db")
    db_user = st.text_input("User", value="world")
    db_password = st.text_input("Password", type="password", value="world123")

    if st.button("Connect"):
        connection_details = {
            "dialect": db_type,
            "host": db_host,
            "port": db_port,
            "database": db_name,
            "user": db_user,
            "password": db_password
        }
        # Call the database connection API
        try:
            response = requests.post(DB_CONNECT_API, json={
                "url": f"jdbc:{db_type}://{db_host}:{db_port}/{db_name}",
                "username": db_user,
                "password": db_password,
                "dbType": db_type
            })
            if response.status_code == 200:
                result = response.json()
                if result.get("statusCode") != 200:
                    st.error("Failed to connect: " +
                             result.get("message", "Unknown error"))
                    return

                st.success("Connection successful! with message: " +
                           result.get("message", ""))
                schema = result.get("data", {})
                st.session_state["db_schema"] = schema
                # Display the fetched schema
                st.subheader("Fetched Schema")
                st.json(schema)
                st.session_state["db_connection"] = connection_details
            else:
                st.error(
                    f"Failed to connect: {response.json().get('error', 'Unknown error')}")
        except Exception as e:
            st.error(f"Error connecting to database: {e}")

# Page 2: Fetch Database Information


def fetch_database_info():
    st.title("Fetch Database Information")

    if "db_connection" not in st.session_state:
        st.error("Please connect to a database in the 'Connect Data Source' page.")
        return

    st.subheader("Fetch Tables and Columns")

    if st.button("Fetch"):
        try:
            response = requests.post(
                DB_CONNECT_API, json=st.session_state["db_connection"])
            if response.status_code == 200:
                schema = response.json().get("data", {})
                st.session_state["db_schema"] = schema
                st.success("Schema fetched successfully!")
            else:
                st.error(
                    f"Failed to fetch schema: {response.json().get('error', 'Unknown error')}")
        except Exception as e:
            st.error(f"Error fetching schema: {e}")

    if "db_schema" in st.session_state:
        schema = st.session_state["db_schema"]

        for table_index, table in enumerate(schema.get("tables", [])):
            with st.expander(f"Table: {table['name']}"):
                st.markdown(f"#### Table: {table['name']}")

                # Display a summary of the table
                st.markdown(
                    f"**Primary Keys:** {', '.join(table.get('primary_keys', []))}")
                st.markdown(
                    f"**Foreign Keys:** {', '.join([fk['column'] + " → " + fk['references']   for fk in table.get('foreign_keys', [])])}")

                # Create a table-like structure for columns
                st.write("### Edit Column Descriptions")
                # Create three columns: Column Name, Data Type, Description
                cols = st.columns([1, 2, 3])

                with cols[0]:
                    st.write("**Column Name**")
                with cols[1]:
                    st.write("**Data Type**")
                with cols[2]:
                    st.write("**Description**")

                for column_index, column in enumerate(table.get("columns", [])):
                    # Create a container for this row
                    row = st.container()

                    # Use columns inside the container
                    with row:
                        cols = st.columns([1, 2, 3])

                        with cols[0]:
                            st.write(column["name"])
                        with cols[1]:
                            st.write(column["dtype"])
                        with cols[2]:
                            # Remove label and adjust padding
                            column["description"] = st.text_input(
                                "",
                                value=column.get("description", ""),
                                placeholder=f"Description for {column['name']}",
                                key=f"{table_index}-{column_index}",
                                label_visibility="hidden"
                            )
        if st.button("Save Schema"):
            with open(LOCAL_SCHEMA_FILE, "w") as file:
                json.dump(schema, file, indent=4)
            st.success("Schema saved locally!")


# Page 3: Chat with Database


def chat_with_database():
    st.title("Chat with Database")

    if not os.path.exists(LOCAL_SCHEMA_FILE):
        st.error(
            "Please fetch and save the database schema in the 'Fetch Database Information' page.")
        return

    with open(LOCAL_SCHEMA_FILE, "r") as file:
        schema = json.load(file)

    st.subheader("Ask Questions")
    user_question = st.text_input("Enter your question:")
    if st.button("Generate SQL"):
        try:
            response = requests.post(GENERATE_SQL_API, json={
                "schema": schema,
                "question": user_question,
                "model_name": "mannix/defog-llama3-sqlcoder-8b:q8_0"  # Default model
            })
            if response.status_code == 200:
                st.text_area("Generated SQL", response.json().get(
                    "sql", ""), height=200)
            else:
                st.error(
                    f"Error generating SQL: {response.json().get('error', 'Unknown error')}")
        except Exception as e:
            st.error(f"Error: {e}")


# Streamlit app navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio("Go to", [
                        "Connect Data Source", "Fetch Database Information", "Chat with Database"])

if page == "Connect Data Source":
    connect_data_source()
elif page == "Fetch Database Information":
    fetch_database_info()
elif page == "Chat with Database":
    chat_with_database()
