import requests
import os
import base64
import io
from enums.response_enum import ResponseEnum
from exceptions.app_exception import AppException
from config.consul import ConsulClient

API_HOST = ConsulClient().get_service_address("slm-embed") or "http://localhost:8181"

_endpoints = {
    "connect": f"{API_HOST}/db/connect",
    "connect_sqlite": f"{API_HOST}/db/connect/sqlite",
    "query": f"{API_HOST}/db/query",
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
        if result.get("statusCode") == 200:
            schema = result.get("data", {})
            if not schema:
                raise ValueError("Schema not found in the API response.")
            table_details = schema.get("tables", [])
            return table_details
        else:
            raise AppException(ResponseEnum.FAILED_TO_GET_SCHEMA);
    else:
        raise AppException(ResponseEnum.FAILED_TO_GET_SCHEMA);
