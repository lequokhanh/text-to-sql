import requests
import os
import base64
import io
from enums.response_enum import ResponseEnum
from exceptions.app_exception import AppException
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


API_HOST = f"http://{os.getenv('EMBED_HOST_API')}:8080"
logger.info("EMBED_HOST_API: " + API_HOST)

_endpoints = {
    "connect": f"{API_HOST}/api/v1/db/get-schema",
    "connect_sqlite": f"{API_HOST}/api/v1/db/get-schema/sqlite",
    "query": f"{API_HOST}/api/v1/db/query",
    "query_sqlite": f"{API_HOST}/api/v1/db/query/sqlite",
}


def validate_connection_payload(connection_payload):
    db_type = connection_payload.get("dbType", "").lower()
    
    if db_type not in ["postgresql", "mysql", "sqlite"]:
        return False, "Unsupported database type"
    
    if db_type == "sqlite":
        if "file" not in connection_payload:
            return False, "Missing SQLite file in connection payload"
    else:
        required_fields = ["url", "username", "password"]
        missing_fields = [field for field in required_fields if field not in connection_payload]
        if missing_fields:
            return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None

def get_schema(connection_payload):
    
    db_type = connection_payload.get("dbType", "").lower()
    try:
        if db_type == "sqlite":
            api_url = _endpoints["connect_sqlite"]
            
            # Check if file is a base64 string and decode it
            file_data = connection_payload["file"]
            if isinstance(file_data, str):
                try:
                    # Decode base64 to binary
                    binary_data = base64.b64decode(file_data)
                    files = {'file': ('database.sqlite', binary_data, 'application/octet-stream')}
                except Exception as e:
                    raise ValueError(f"Invalid base64 encoded file: {str(e)}")
            else:
                # Already binary data
                files = {'file': ('database.sqlite', file_data, 'application/octet-stream')}
                
            response = requests.post(api_url, files=files)
        else:
            # For PostgreSQL and MySQL
            api_url = _endpoints["connect"]
            response = requests.post(api_url, json=connection_payload)
    except Exception as e:
        raise AppException(ResponseEnum.CANNOT_CONNECT_TO_EMBEB_SERVER);
    
    if response.status_code == 200:
        result = response.json()
        if result.get("code") == 0:
            schema = result.get("data", {})
            if not schema:
                raise ValueError("Schema not found in the API response.")
            table_details = schema.get("tables", [])
            return table_details
        else:
            raise AppException(ResponseEnum.FAILED_TO_GET_SCHEMA);
    else:
        raise AppException(ResponseEnum.FAILED_TO_GET_SCHEMA);

def execute_sql(connection_payload, sql_query):
    db_type = connection_payload.get("dbType", "").lower()
    try:
        if db_type == "sqlite":
            api_url = _endpoints["query_sqlite"]
            
            # Check if file is a base64 string and decode it
            file_data = connection_payload["file"]
            if isinstance(file_data, str):
                try:
                    # Decode base64 to binary
                    binary_data = base64.b64decode(file_data)
                    files = {'file': ('database.sqlite', binary_data, 'application/octet-stream')}
                except Exception as e:
                    raise ValueError(f"Invalid base64 encoded file: {str(e)}")
            else:
                # Already binary data
                files = {'file': ('database.sqlite', file_data, 'application/octet-stream')}
                
            # Update to match curl format - query parameter sent as form field
            response = requests.post(api_url, files=files, data={"query": sql_query}, timeout=200)
        else:
            # For PostgreSQL and MySQL
            api_url = _endpoints["query"]
            # Update to match curl format - include all connection details along with query
            payload = {**connection_payload, "query": sql_query}
            response = requests.post(api_url, json=payload, timeout=200)
    except requests.exceptions.Timeout:
        raise AppException(ResponseEnum.TIMEOUT_ERROR)
    except Exception as e:
        raise AppException(ResponseEnum.CANNOT_CONNECT_TO_EMBEB_SERVER)
    
    result = response.json()
    if response.status_code == 200 and result.get("code") == 0:
        return {
            "data": result.get("data", {}),
            "error": None
        }
    elif response.status_code == 200 and (result.get("code") == 2002 or result.get("code") == 2004):
        return {
            "data": None,
            "error": result.get("message", {})
        }
    else:
        raise AppException(ResponseEnum.FAILED_TO_EXECUTE_QUERY)
