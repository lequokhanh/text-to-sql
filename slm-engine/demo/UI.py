import streamlit as st
import requests
import json

# Set up the Streamlit form
st.title("Text-to-SQL Application")
st.sidebar.header("Database Connection")

# Database type selection
db_type = st.sidebar.selectbox(
    "Select Database Type",
    ("postgresql", "mysql")
)

# Connection details
connection_string = st.sidebar.text_input(
    "Connection String", placeholder="e.g., jdbc:postgresql://localhost:5432/mydatabase")
database = st.sidebar.text_input(
    "Database Name", placeholder="Enter database name")
username = st.sidebar.text_input("Username", placeholder="Enter username")
password = st.sidebar.text_input(
    "Password", placeholder="Enter password", type="password")

# Connect button
if st.sidebar.button("Connect"):
    # API call payload
    payload = {
        "url": connection_string,
        "username": username,
        "password": password,
        "dbType": db_type
    }

    try:
        # Send API request
        response = requests.post(
            "http://localhost:8181/db/connect", json=payload)
        response_data = response.json()

        # Handle successful response
        if response.status_code == 200 and response_data.get("statusCode") == 200:
            st.success("Schema retrieved successfully!")

            schema = response_data.get("data", {})
            database_name = schema.get("database", "")
            tables = schema.get("tables", [])

            st.subheader(f"Database: {database_name}")

            for table in tables:
                st.markdown(f"### Table: {table['name']}")

                columns_data = []
                for column in table.get("columns", []):
                    columns_data.append({
                        "Column Name": column['name'],
                        "Data Type": column['dtype'],
                        "Description": st.text_input(
                            f"Update Description for {column['name']}",
                            value=column.get('description', "")
                        )
                    })

                # Render table view
                st.table(columns_data)

                # Save updated descriptions (simulated)
                if st.button(f"Save Updates for Table {table['name']}"):
                    st.write(
                        f"Descriptions for table {table['name']} updated successfully!")
        else:
            st.error(response_data.get(
                "message", "Failed to retrieve schema."))

    except Exception as e:
        st.error(f"Error connecting to database: {str(e)}")
