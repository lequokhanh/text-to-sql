import streamlit as st
import requests
import json
import os
import base64
import datetime
import glob
import shutil

# Constants for API endpoints
DB_CONNECT_API = "http://localhost:8181/db/connect"
DB_CONNECT_SQLITE_API = "http://localhost:8181/db/connect/sqlite"
QUERY_API = "http://localhost:5000/query"
QUERY_WITH_SCHEMA_API = "http://localhost:5000/query_with_schema"
LOCAL_SCHEMA_FILE = "database_schema.json"
SCHEMA_DIRECTORY = os.path.abspath("saved_schemas")

# Ensure schema directory exists
os.makedirs(SCHEMA_DIRECTORY, exist_ok=True)

# Custom CSS to fix alignment issues
def apply_custom_css():
    st.markdown("""
    <style>
    .stTextInput > div > div > input {
        height: 36px;
        padding-top: 0px;
        padding-bottom: 0px;
    }
    .column-cell {
        display: flex;
        align-items: center;
        min-height: 42px;
    }
    .description-input {
        width: 100%;
    }
    .schema-card {
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 15px;
        background-color: #f9f9f9;
    }
    .schema-card h4 {
        margin-top: 0;
    }
    .schema-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
    }
    </style>
    """, unsafe_allow_html=True)

# Page 1: Connect Data Source
def connect_data_source():
    apply_custom_css()
    st.title("Connect Data Source")

    # Database type selection with SQLite option
    db_type = st.selectbox("Database Type", ["postgresql", "mysql", "sqlite"])
    
    if db_type == "sqlite":
        # SQLite connection via file upload
        st.subheader("Upload SQLite Database File")
        uploaded_file = st.file_uploader("Choose a SQLite file", type=["sqlite", "db", "sqlite3"])
        
        if uploaded_file is not None:
            if st.button("Connect"):
                try:
                    # Read the uploaded file
                    file_bytes = uploaded_file.getvalue()
                    # Create connection payload for SQLite
                    sqlite_base64 = base64.b64encode(file_bytes).decode('utf-8')
                    connection_payload = {
                        "file": sqlite_base64,
                        "dbType": "sqlite"
                    }
                    
                    st.session_state["connection_payload"] = connection_payload
                    
                    # Get schema using Connect SQLite API
                    try:
                        # Call the SQLite specific connection API
                        files = {'file': (uploaded_file.name, file_bytes, 'application/octet-stream')}
                        response = requests.post(DB_CONNECT_SQLITE_API, files=files)
                        
                        if response.status_code == 200:
                            result = response.json()
                            if result.get("statusCode") != 200:
                                st.error("Failed to connect: " +
                                         result.get("message", "Unknown error"))
                                return
                                
                            st.success(f"Successfully connected to SQLite database: {uploaded_file.name}")
                            schema = result.get("data", {})
                            
                            # Add database name and type information to schema
                            if "meta" not in schema:
                                schema["meta"] = {}
                            schema["meta"]["db_name"] = uploaded_file.name
                            schema["meta"]["db_type"] = "sqlite"
                            schema["meta"]["connection_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            
                            st.session_state["db_schema"] = schema
                            st.session_state["db_connected"] = True
                            
                            # Save schema to file
                            with open(LOCAL_SCHEMA_FILE, "w") as file:
                                json.dump(schema, file, indent=4)
                            st.success("Schema saved to local file for later use.")
                            
                            # Save to persistent storage
                            schema_filename = f"{uploaded_file.name.split('.')[0]}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                            save_path = os.path.join(SCHEMA_DIRECTORY, schema_filename)
                            try:
                                with open(save_path, "w") as file:
                                    json.dump(schema, file, indent=4)
                                st.success(f"Schema also saved to {save_path}")
                            except Exception as e:
                                st.warning(f"Could not save to schema directory: {str(e)}")
                            
                            # Display the fetched schema with editable descriptions
                            display_editable_schema(schema)
                        else:
                            st.error(f"Failed to connect: {response.json().get('error', 'Unknown error')}")
                    except Exception as e:
                        st.error(f"Error connecting to database: {e}")
                except Exception as e:
                    st.error(f"Error processing SQLite file: {e}")
    else:
        # Standard connection for PostgreSQL/MySQL
    st.subheader("Enter Database Connection Details")
    db_host = st.text_input("Host", value="host.docker.internal")
        db_port = st.text_input("Port", value="5432" if db_type == "postgresql" else "3306")
    db_name = st.text_input("Database Name", value="world-db")
    db_user = st.text_input("User", value="world")
    db_password = st.text_input("Password", type="password", value="world123")

    if st.button("Connect"):
            # Create connection payload
            connection_payload = {
                "url": f"jdbc:{db_type}://{db_host}:{db_port}/{db_name}",
                "username": db_user,
                "password": db_password,
                "dbType": db_type
            }
            
            st.session_state["connection_payload"] = connection_payload
            
            # Call the database connection API
            try:
                response = requests.post(DB_CONNECT_API, json=connection_payload)
            if response.status_code == 200:
                result = response.json()
                if result.get("statusCode") != 200:
                    st.error("Failed to connect: " +
                             result.get("message", "Unknown error"))
                    return

                st.success("Connection successful! with message: " +
                           result.get("message", ""))
                schema = result.get("data", {})
                    
                    # Add database name and type information to schema
                    if "meta" not in schema:
                        schema["meta"] = {}
                    schema["meta"]["db_name"] = db_name
                    schema["meta"]["db_type"] = db_type
                    schema["meta"]["host"] = db_host
                    schema["meta"]["connection_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                st.session_state["db_schema"] = schema
                    st.session_state["db_connected"] = True
                    
                    # Save schema to file
                    with open(LOCAL_SCHEMA_FILE, "w") as file:
                        json.dump(schema, file, indent=4)
                    st.success("Schema saved to local file for later use.")
                    
                    # Save to persistent storage
                    schema_filename = f"{db_name}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                    save_path = os.path.join(SCHEMA_DIRECTORY, schema_filename)
                    try:
                        with open(save_path, "w") as file:
                            json.dump(schema, file, indent=4)
                        st.success(f"Schema also saved to {save_path}")
                    except Exception as e:
                        st.warning(f"Could not save to schema directory: {str(e)}")
                    
                    # Display the fetched schema with editable descriptions
                    display_editable_schema(schema)
            else:
                    st.error(f"Failed to connect: {response.json().get('error', 'Unknown error')}")
        except Exception as e:
            st.error(f"Error connecting to database: {e}")

# Function to display schema with editable descriptions
def display_editable_schema(schema):
    st.subheader("Database Schema")
    
    # Initialize schema if not in session state or if structure doesn't match
    if ("edited_schema" not in st.session_state or 
        "tables" not in st.session_state["edited_schema"] or 
        len(st.session_state["edited_schema"].get("tables", [])) != len(schema.get("tables", []))):
        # Deep copy the schema to avoid reference issues
        st.session_state["edited_schema"] = json.loads(json.dumps(schema))
    
    # Make sure tables exist in schema
    if "tables" not in schema:
        st.error("Invalid schema format: 'tables' field is missing")
        return

    # Display tables in expandable sections
        for table_index, table in enumerate(schema.get("tables", [])):
            with st.expander(f"Table: {table['name']}"):
            st.markdown(f"#### {table['name']}")
            
            # Display primary keys if available
            if "primary_keys" in table:
                st.markdown(f"**Primary Keys:** {', '.join(table.get('primary_keys', []))}")
            
            # Display foreign keys if available
            if "foreign_keys" in table and table["foreign_keys"]:
                foreign_keys_text = ", ".join([f"{fk['column']} → {fk['references']}" for fk in table.get('foreign_keys', [])])
                st.markdown(f"**Foreign Keys:** {foreign_keys_text}")
            
            # Create editable table for columns with better alignment
            if table.get("columns"):
                st.write("### Edit Column Descriptions")
                
                # Use HTML/CSS for better header alignment
                st.markdown("""
                <div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 10px; margin-bottom: 10px;">
                    <div style="font-weight: bold;">Column Name</div>
                    <div style="font-weight: bold;">Data Type</div>
                    <div style="font-weight: bold;">Description</div>
                </div>
                """, unsafe_allow_html=True)
                
                # Create a container for all rows for consistent styling
                table_container = st.container()
                
                with table_container:
                for column_index, column in enumerate(table.get("columns", [])):
                        # Create a proper grid layout for each row
                        col1, col2, col3 = st.columns([1, 1, 2])
                        
                        with col1:
                            st.markdown(f"""<div class="column-cell">{column["name"]}</div>""", unsafe_allow_html=True)
                            
                        with col2:
                            st.markdown(f"""<div class="column-cell">{column.get("dtype", "")}</div>""", unsafe_allow_html=True)
                            
                        with col3:
                            # Get current description safely
                            current_description = ""
                            try:
                                current_description = column.get("description", "")
                            except:
                                pass
                                
                            # Create a unique key for each text input
                            input_key = f"desc_{table_index}_{column_index}"
                            
                            # Update the description in the schema
                            new_description = st.text_input(
                                "",
                                value=current_description,
                                placeholder=f"Description for {column['name']}",
                                key=input_key,
                                label_visibility="hidden"
                            )
                            
                            # Update the description in our session state schema safely
                            try:
                                # Make sure all required structures exist before setting the description
                                if "tables" not in st.session_state["edited_schema"]:
                                    st.session_state["edited_schema"]["tables"] = []
                                
                                # Ensure table exists
                                while len(st.session_state["edited_schema"]["tables"]) <= table_index:
                                    st.session_state["edited_schema"]["tables"].append({})
                                
                                # Ensure columns exist
                                if "columns" not in st.session_state["edited_schema"]["tables"][table_index]:
                                    st.session_state["edited_schema"]["tables"][table_index]["columns"] = []
                                
                                # Ensure column exists
                                while len(st.session_state["edited_schema"]["tables"][table_index]["columns"]) <= column_index:
                                    st.session_state["edited_schema"]["tables"][table_index]["columns"].append({})
                                
                                # Now it's safe to set the description
                                st.session_state["edited_schema"]["tables"][table_index]["columns"][column_index]["description"] = new_description
                            except Exception as e:
                                st.error(f"Error updating description: {str(e)}")
    
    # Add schema name input and save button
    st.write("### Save Schema")
    schema_name = st.text_input("Schema Name", value=schema.get("meta", {}).get("db_name", "my_schema"), 
                               help="Enter a name to identify this schema")
    
    # Get options for save action
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("Save Schema Changes"):
            try:
                # Update schema name
                if "meta" not in st.session_state["edited_schema"]:
                    st.session_state["edited_schema"]["meta"] = {}
                st.session_state["edited_schema"]["meta"]["schema_name"] = schema_name
                
                # Save to current session file
            with open(LOCAL_SCHEMA_FILE, "w") as file:
                    json.dump(st.session_state["edited_schema"], file, indent=4)
                
                # Save to persistent storage with timestamp
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                schema_filename = f"{schema_name}_{timestamp}.json"
                save_path = os.path.join(SCHEMA_DIRECTORY, schema_filename)
                
                try:
                    with open(save_path, "w") as file:
                        json.dump(st.session_state["edited_schema"], file, indent=4)
                        
                    st.success(f"Schema saved successfully as '{schema_name}'!\nYou can access this schema in the 'Manage Schemas' page.")
                except Exception as e:
                    st.error(f"Error saving schema to {save_path}: {str(e)}")
            except Exception as e:
                st.error(f"Error saving schema: {str(e)}")
    
    with col2:
        if st.button("Go to Manage Schemas"):
            st.session_state["page"] = "Manage Schemas"
            st.experimental_rerun()

# Page 2: Chat with Database
def chat_with_database():
    apply_custom_css()
    st.title("Chat with Database")

    # Check connection options
    connection_options = []
    
    if "db_connected" in st.session_state and st.session_state["db_connected"]:
        connection_options.append("Live Connection")
    
    if os.path.exists(LOCAL_SCHEMA_FILE):
        connection_options.append("Current Schema")
        
    # Add option for saved schemas if any exist
    saved_schemas = glob.glob(os.path.join(SCHEMA_DIRECTORY, "*.json"))
    if saved_schemas:
        connection_options.append("Saved Schema")
    
    if not connection_options:
        st.error("Please connect to a database first in the 'Connect Data Source' page or load a saved schema.")
        return

    # Let user choose between connection types
    connection_type = st.radio("Choose connection type:", connection_options)

    # If using saved schema, let user select which one
    selected_schema_file = None
    if connection_type == "Saved Schema":
        schema_files = glob.glob(os.path.join(SCHEMA_DIRECTORY, "*.json"))
        schema_options = []
        
        for file_path in schema_files:
            try:
                with open(file_path, 'r') as file:
                    schema_data = json.load(file)
                    schema_name = schema_data.get("meta", {}).get("schema_name") or os.path.basename(file_path)
                    db_name = schema_data.get("meta", {}).get("db_name", "Unknown")
                    db_type = schema_data.get("meta", {}).get("db_type", "Unknown")
                    timestamp = os.path.basename(file_path).split('_')[-1].split('.')[0]
                    schema_options.append((file_path, f"{schema_name} ({db_type}:{db_name}, {timestamp})"))
            except:
                # Skip invalid files
                continue
                
        if schema_options:
            schema_labels = [option[1] for option in schema_options]
            selected_index = st.selectbox("Select Schema:", range(len(schema_labels)), format_func=lambda x: schema_labels[x])
            selected_schema_file = schema_options[selected_index][0]
        else:
            st.error("No valid saved schemas found.")
            return

    st.subheader("Ask Questions About Your Data")
    user_question = st.text_input("Enter your question about the database:")
    
    if st.button("Generate SQL"):
        if not user_question:
            st.warning("Please enter a question.")
            return
            
        try:
            if connection_type == "Live Connection":
                # Use live connection payload
                payload = {
                    "query": user_question,
                    "connection_payload": st.session_state["connection_payload"]
                }
                
                with st.spinner("Generating SQL..."):
                    response = requests.post(QUERY_API, json=payload)
            else:
                # Load schema based on selected connection type
                if connection_type == "Current Schema":
                    schema_path = LOCAL_SCHEMA_FILE
                else:  # Saved Schema
                    schema_path = selected_schema_file
                    
                with open(schema_path, "r") as file:
                    schema = json.load(file)
                
                tables = schema.get("tables", [])
                payload = {
                    "query": user_question,
                    "schema": tables
                }
                
                with st.spinner("Generating SQL with schema..."):
                    response = requests.post(QUERY_WITH_SCHEMA_API, json=payload)
                
            if response.status_code == 200:
                result = response.json()
                generated_sql = result.get("sql", "")
                
                # Display the generated SQL
                st.subheader("Generated SQL")
                st.code(generated_sql, language="sql")
                
                # Option to execute the SQL
                if st.button("Execute SQL"):
                    st.info("SQL execution functionality not implemented yet.")
            else:
                st.error(f"Error generating SQL: {response.json().get('error', 'Unknown error')}")
        except Exception as e:
            st.error(f"Error: {str(e)}")

# Page 3: Manage Schemas
def manage_schemas():
    apply_custom_css()
    st.title("Manage Saved Schemas")
    
    # List all saved schemas with absolute path
    schema_files = glob.glob(os.path.join(SCHEMA_DIRECTORY, "*.json"))
    
    # Debug information
    st.write(f"Schema directory: {SCHEMA_DIRECTORY}")
    st.write(f"Schema directory exists: {os.path.exists(SCHEMA_DIRECTORY)}")
    
    if not schema_files:
        st.info(f"No saved schemas found in {SCHEMA_DIRECTORY}. Connect to a database and save a schema first.")
        
        # Check if any schemas exist in current directory
        current_dir_schemas = glob.glob("*.json")
        if current_dir_schemas:
            st.warning(f"Found {len(current_dir_schemas)} JSON files in current directory. They may be schemas saved to the wrong location.")
            if st.button("Move JSON files to schema directory"):
                moved_count = 0
                for file in current_dir_schemas:
                    if file != LOCAL_SCHEMA_FILE:  # Don't move the current working schema
                        try:
                            # Create destination path
                            dest_path = os.path.join(SCHEMA_DIRECTORY, file)
                            # Copy file to schema directory
                            shutil.copy2(file, dest_path)
                            moved_count += 1
                        except Exception as e:
                            st.error(f"Error moving {file}: {str(e)}")
                
                if moved_count > 0:
                    st.success(f"Moved {moved_count} files to schema directory. Please refresh.")
                    st.experimental_rerun()
        return
    
    st.write(f"Found {len(schema_files)} saved schemas:")
    
    # Display each schema with metadata and actions
    for schema_file in schema_files:
        try:
            with open(schema_file, 'r') as file:
                schema_data = json.load(file)
                
            # Extract metadata
            meta = schema_data.get("meta", {})
            schema_name = meta.get("schema_name") or os.path.basename(schema_file).split('_')[0]
            db_name = meta.get("db_name", "Unknown")
            db_type = meta.get("db_type", "Unknown")
            connection_time = meta.get("connection_time", "Unknown")
            table_count = len(schema_data.get("tables", []))
            file_timestamp = os.path.basename(schema_file).split('_')[-1].split('.')[0]
            
            # Create a card-like display for each schema
            st.markdown(f"""
            <div class="schema-card">
                <h4>{schema_name}</h4>
                <p><strong>Database:</strong> {db_name} ({db_type})<br>
                <strong>Saved:</strong> {connection_time or file_timestamp}<br>
                <strong>Tables:</strong> {table_count}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Actions for this schema
            col1, col2, col3 = st.columns(3)
            
            # Use a unique key for each button based on the filename
            file_key = os.path.basename(schema_file)
            
            with col1:
                if st.button(f"View Schema", key=f"view_{file_key}"):
                    # Store the schema in session state and show details
                    st.session_state["view_schema"] = schema_data
                    st.session_state["view_schema_file"] = schema_file
            
            with col2:
                if st.button(f"Load for Query", key=f"load_{file_key}"):
                    # Copy the schema to the current working file
                    with open(LOCAL_SCHEMA_FILE, "w") as file:
                        json.dump(schema_data, file, indent=4)
                    st.success(f"Schema '{schema_name}' loaded successfully!")
                    st.session_state["page"] = "Chat with Database"
                    st.experimental_rerun()
            
            with col3:
                if st.button(f"Delete", key=f"delete_{file_key}"):
                    try:
                        os.remove(schema_file)
                        st.success(f"Schema '{schema_name}' deleted.")
                        st.experimental_rerun()
                    except Exception as e:
                        st.error(f"Error deleting schema: {str(e)}")
            
            # Show the schema details if selected for viewing
            if "view_schema" in st.session_state and "view_schema_file" in st.session_state and st.session_state["view_schema_file"] == schema_file:
                with st.expander("Schema Details", expanded=True):
                    # Display tables in the schema
                    for table in schema_data.get("tables", []):
                        st.markdown(f"#### Table: {table['name']}")
                        
                        # Show primary and foreign keys
                        if "primary_keys" in table and table["primary_keys"]:
                            st.markdown(f"**Primary Keys:** {', '.join(table.get('primary_keys', []))}")
                        
                        if "foreign_keys" in table and table["foreign_keys"]:
                            foreign_keys_text = ", ".join([f"{fk['column']} → {fk['references']}" for fk in table.get('foreign_keys', [])])
                            st.markdown(f"**Foreign Keys:** {foreign_keys_text}")
                        
                        # Show columns in a table
                        if "columns" in table and table["columns"]:
                            column_data = []
                            for column in table["columns"]:
                                column_data.append({
                                    "Column Name": column["name"],
                                    "Data Type": column.get("dtype", ""),
                                    "Description": column.get("description", "")
                                })
                            st.table(column_data)
                        
                        st.markdown("---")
                        
                    # Button to edit this schema
                    if st.button("Edit This Schema", key=f"edit_{file_key}"):
                        # Copy to current schema and go to edit page
                        with open(LOCAL_SCHEMA_FILE, "w") as file:
                            json.dump(schema_data, file, indent=4)
                        st.session_state["db_schema"] = schema_data
                        st.session_state["db_connected"] = True
                        st.session_state["page"] = "Connect Data Source"
                        st.experimental_rerun()
        
        except Exception as e:
            st.error(f"Error displaying schema {os.path.basename(schema_file)}: {str(e)}")
            continue
    
    # Add export/import functionality
    st.markdown("---")
    st.subheader("Import/Export Schemas")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("### Export All Schemas")
        if st.button("Export as ZIP"):
            try:
                # Create a ZIP file with all schemas
                zip_filename = f"all_schemas_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
                zip_path = os.path.abspath("all_schemas")
                shutil.make_archive(zip_path, 'zip', SCHEMA_DIRECTORY)
                
                # Provide download link
                with open(f"{zip_path}.zip", "rb") as file:
                    btn = st.download_button(
                        label="Download ZIP",
                        data=file,
                        file_name=zip_filename,
                        mime="application/zip"
                    )
                st.success(f"Schemas exported successfully from {SCHEMA_DIRECTORY}. Click the download button above.")
            except Exception as e:
                st.error(f"Error exporting schemas: {str(e)}")
    
    with col2:
        st.write("### Import Schema")
        uploaded_file = st.file_uploader("Upload Schema JSON", type=["json"])
        
        if uploaded_file is not None:
            try:
                # Read and validate the uploaded schema
                schema_data = json.loads(uploaded_file.getvalue().decode('utf-8'))
                
                if "tables" not in schema_data:
                    st.error("Invalid schema format: 'tables' field is missing")
                else:
                    # Get a name for the imported schema
                    import_name = st.text_input("Schema Name", value=uploaded_file.name.split('.')[0])
                    
                    if st.button("Import Schema"):
                        # Add metadata if missing
                        if "meta" not in schema_data:
                            schema_data["meta"] = {}
                        schema_data["meta"]["schema_name"] = import_name
                        schema_data["meta"]["import_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        
                        # Save the schema
                        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                        schema_filename = f"{import_name}_{timestamp}.json"
                        save_path = os.path.join(SCHEMA_DIRECTORY, schema_filename)
                        
                        try:
                            with open(save_path, "w") as file:
                                json.dump(schema_data, file, indent=4)
                                
                            st.success(f"Schema '{import_name}' imported successfully!")
                            st.experimental_rerun()
                        except Exception as e:
                            st.error(f"Error saving imported schema to {save_path}: {str(e)}")
                        
            except Exception as e:
                st.error(f"Error importing schema: {str(e)}")

# Main app routing
def main():
    # Initialize page state if needed
    if "page" not in st.session_state:
        st.session_state["page"] = "Connect Data Source"
    
    # Navigation sidebar
st.sidebar.title("Navigation")
    
    # Allow changing page from sidebar
    selected_page = st.sidebar.radio(
        "Go to", 
        ["Connect Data Source", "Chat with Database", "Manage Schemas"],
        index=["Connect Data Source", "Chat with Database", "Manage Schemas"].index(st.session_state["page"])
    )
    
    # Update session state if page changed
    if selected_page != st.session_state["page"]:
        st.session_state["page"] = selected_page
    
    # Display the appropriate page
    if st.session_state["page"] == "Connect Data Source":
    connect_data_source()
    elif st.session_state["page"] == "Chat with Database":
    chat_with_database()
    elif st.session_state["page"] == "Manage Schemas":
        manage_schemas()

# Run the app
main()
