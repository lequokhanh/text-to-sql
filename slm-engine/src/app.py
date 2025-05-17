import os
import atexit
import socket
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields, Namespace
from core.workflow import SQLAgentWorkflow, SchemaEnrichmentWorkflow
from core.baseline_workflow import BaselineWorkflow
from core.templates import text2sql_prompt_routing, TABLE_RETRIEVAL_TMPL
from core.services import get_schema, get_sample_data
from core.llm import llm_config, LLMFactory
from core.services import validate_connection_payload
from exceptions.global_exception_handler import register_error_handlers
from exceptions.app_exception import AppException
from response.app_response import ResponseWrapper
from dotenv import load_dotenv
import logging
from pathlib import Path
import asyncio
from functools import wraps

# Configure logging with a more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Starting application initialization...")

# Load environment variables
env_path = Path('.env')
load_dotenv(dotenv_path=env_path)
logger.info(f"Looking for .env file at: {env_path.absolute()}")
logger.info(f"{os.getenv('ENV')}")

# Initialize Flask app
app = Flask(__name__)
CORS(app)
logger.info("Flask app initialized with CORS support")

# Initialize Flask-RESTX
api = Api(
    app,
    version='1.0',
    title='SLM Engine API',
    description='A RESTful API for SQL Language Model Engine',
    doc='/docs'
)

# Define models for request/response documentation
connection_payload_model = api.model('ConnectionPayload', {
    'url': fields.String(required=True, description='Database host'),
    'username': fields.String(required=True, description='Database username'),
    'password': fields.String(required=True, description='Database password'),
    'dbType': fields.String(required=True, description='Database type (postgresql, mysql, sqlite)'),
    'schema_enrich_info': fields.Raw(required=False, description='Schema enrichment information')
})

query_request_model = api.model('QueryRequest', {
    'query': fields.String(required=True, description='Natural language query'),
    'connection_payload': fields.Nested(connection_payload_model, required=True)
})

settings_model = api.model('Settings', {
    'provider': fields.String(required=False, description='LLM provider (ollama or google)'),
    'ollama_host': fields.String(required=False, description='Ollama host URL'),
    'ollama_model': fields.String(required=False, description='Ollama model name'),
    'additional_kwargs': fields.Raw(required=False, description='Additional Ollama parameters'),
    'model': fields.String(required=False, description='Google model name'),
    'api_key': fields.String(required=False, description='Google API key'),
    'temperature': fields.Float(required=False, description='Model temperature'),
    'max_tokens': fields.Integer(required=False, description='Maximum tokens'),
    'prompt_routing': fields.Integer(required=False, description='Prompt routing setting (0 or 1)'),
    'enrich_schema': fields.Boolean(required=False, description='Schema enrichment setting')
})

# Register error handlers
register_error_handlers(app)
logger.info("Error handlers registered")

# Initialize workflows with the centralized LLM
TEXT_TO_SQL_PROMPT_TMPL = text2sql_prompt_routing(llm_config.settings["prompt_routing"])
workflow = SQLAgentWorkflow(
    text2sql_prompt=TEXT_TO_SQL_PROMPT_TMPL,
    table_retrieval_prompt=TABLE_RETRIEVAL_TMPL,
    llm=llm_config.get_llm(),
    verbose=True
)
logger.info("SQL Agent Workflow initialized successfully")

schema_workflow = SchemaEnrichmentWorkflow(
    llm=llm_config.get_llm(),
    verbose=True
)
logger.info("Schema Enrichment Workflow initialized successfully")

baseline_workflow = BaselineWorkflow(
    llm=llm_config.get_llm(),
    text2sql_prompt=TEXT_TO_SQL_PROMPT_TMPL,
    verbose=True
)
logger.info("Baseline Workflow initialized successfully")

SERVICE_PORT = int(os.getenv("SERVICE_PORT", 5000))

# Default values for new settings
PROMPT_ROUTING = int(os.getenv("PROMPT_ROUTING", 0))
ENRICH_SCHEMA = os.getenv("ENRICH_SCHEMA", "True").lower() in ["true", "1", "yes", "y"]

# Log all configuration values
logger.info("Configuration loaded:")
logger.info(f"PROMPT_ROUTING: {PROMPT_ROUTING}")
logger.info(f"ENRICH_SCHEMA: {ENRICH_SCHEMA}")

def print_banner(banner_file='banner.txt'):
    """Print a banner from a file when the application starts if it exists"""
    try:
        # Check if the banner file exists
        if os.path.exists(banner_file):
            # Read the banner from the file
            with open(banner_file, 'r') as f:
                banner = f.read()
            logger.info("\n" + banner)
    except Exception:
        # Silently ignore any errors reading the banner file
        pass
        
    # Always log server started message
    logger.info("Server started successfully!")

def enrich_schema_with_info(table_details, connection_payload):
    """
    Enrich schema with additional information from schema_enrich_info.
    
    Args:
        table_details (list): List of table details from database schema
        connection_payload (dict): Connection payload containing schema enrichment info
        
    Returns:
        tuple: (enriched_table_details, database_description)
    """
    database_description = ""
    
    if ENRICH_SCHEMA and "schema_enrich_info" in connection_payload and connection_payload["schema_enrich_info"] != {} and "enriched_schema" in connection_payload["schema_enrich_info"] and connection_payload["schema_enrich_info"]["enriched_schema"] is not None:
        logger.info(f"Retrieved schema with {len(table_details)} tables and enrichment information")
        
        # Create mapping from tableIdentifier to enriched table for faster lookup
        enriched_tables_map = {
            table["tableIdentifier"]: table 
            for table in connection_payload["schema_enrich_info"]["enriched_schema"]
        }
        
        # Add database description to response data if available
        if "database_description" in connection_payload["schema_enrich_info"]:
            database_description = connection_payload["schema_enrich_info"]["database_description"]
        
        for table in table_details:
            table_id = table["tableIdentifier"]
            
            # Check if table exists in mapping
            if table_id in enriched_tables_map:
                enriched_table = enriched_tables_map[table_id]
                
                # Update table description
                table["tableDescription"] = enriched_table.get("tableDescription", "")
                
                # Create mapping from columnIdentifier to enriched column
                enriched_columns_map = {
                    col["columnIdentifier"]: col 
                    for col in enriched_table["columns"]
                }
                
                # Update column descriptions
                for column in table["columns"]:
                    column_id = column["columnIdentifier"]
                    
                    # Check update conditions and if column exists in mapping
                    is_empty_description = (
                        column.get("columnDescription") in ["", "NULL", "''"] or
                        column.get("columnDescription") is None or
                        len(str(column.get("columnDescription", ""))) <= 1
                    )
                    
                    if is_empty_description and column_id in enriched_columns_map:
                        enriched_column = enriched_columns_map[column_id]
                        column["columnDescription"] = enriched_column.get("columnDescription", "")
    else:
        logger.info(f"Schema enrichment is disabled or no enrichment info available")
    
    return table_details, database_description

def async_route(f):
    """Decorator to handle async routes in Flask-RESTX"""
    @wraps(f)
    def wrapped(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))
    return wrapped

@api.route('/')
class Home(Resource):
    @api.doc('home',
        responses={
            200: 'Success'
        }
    )
    def get(self):
        """Check if the service is running"""
        return "SLM Engine is running!"

@api.route('/query')
class Query(Resource):
    @api.expect(query_request_model)
    @api.doc('query',
        responses={
            200: 'Success',
            400: 'Bad Request - Missing or invalid parameters',
            500: 'Internal Server Error'
        }
    )
    @async_route
    async def post(self):
        """Process a natural language query and return SQL results"""
        logger.info("Received request to /query endpoint")
        try:
            data = request.json
            query = data.get("query")
            connection_payload = data.get("connection_payload")
            logger.info(f"Processing query: {query}")

            if not query or not connection_payload:
                logger.warning("Missing required parameters in request")
                return jsonify({"error": "Missing 'query' or 'connection_payload'"}), 400
            
            is_valid, error_message = validate_connection_payload(connection_payload)
            if not is_valid:
                logger.warning(f"Invalid connection payload: {error_message}")
                return jsonify({"error": error_message}), 400

            logger.info("Retrieving schema from database")
            table_details = get_schema(connection_payload)
            for table in table_details:
                table["sample_data"] = get_sample_data(
                    connection_payload=connection_payload, 
                    table_details=table
                )
            
            # Enrich schema with additional information
            table_details, database_description = enrich_schema_with_info(table_details, connection_payload)
            logger.info(f"Retrieved schema with {len(table_details)} tables")

            logger.info("Executing workflow")
            response = await workflow.run(
                query=query,
                table_details=table_details,
                database_description=database_description,
                connection_payload=connection_payload
            )
            logger.info("Workflow completed successfully")
            
            return ResponseWrapper.success(response)
            logger.info("Executing workflow")
            response = await workflow.run(
                query=query,
                table_details=table_details,
                database_description=database_description,
                connection_payload=connection_payload
            )
            logger.info("Workflow completed successfully")
            
            return ResponseWrapper.success(response)

        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            raise AppException(str(e), 500)

@api.route('/query-baseline')
class QueryBaseline(Resource):
    @api.expect(query_request_model)
    @api.doc('query_baseline',
        responses={
            200: 'Success',
            400: 'Bad Request - Missing or invalid parameters',
            500: 'Internal Server Error'
        }
    )
    @async_route
    async def post(self):
        """Process a natural language query using baseline workflow"""
        logger.info("Received request to /query-baseline endpoint")
        try:
            data = request.json
            query = data.get("query")
            connection_payload = data.get("connection_payload")
            logger.info(f"Processing query: {query}")
            
            if not query or not connection_payload:
                logger.warning("Missing required parameters in request")
                return jsonify({"error": "Missing 'query' or 'connection_payload'"}), 400
            
            is_valid, error_message = validate_connection_payload(connection_payload)
            if not is_valid:
                logger.warning(f"Invalid connection payload: {error_message}")
                return jsonify({"error": error_message}), 400
            
            logger.info("Retrieving schema from database")
            table_details = get_schema(connection_payload)
            for table in table_details:
                table["sample_data"] = get_sample_data(
                    connection_payload=connection_payload, 
                    table_details=table
                )
            
            # Enrich schema with additional information
            table_details, database_description = enrich_schema_with_info(table_details, connection_payload)
            logger.info(f"Retrieved schema with {len(table_details)} tables")

            logger.info("Executing workflow")
            response = await baseline_workflow.run(
                query=query,
                table_details=table_details,
                database_description=database_description,
                connection_payload=connection_payload
            )
            logger.info("Workflow completed successfully")
            
            return ResponseWrapper.success(response)

        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            raise AppException(str(e), 500)

@api.route('/schema-enrichment')
class SchemaEnrichment(Resource):
    @api.expect(query_request_model)
    @api.doc('schema_enrichment',
        responses={
            200: 'Success',
            400: 'Bad Request - Missing or invalid parameters',
            500: 'Internal Server Error'
        }
    )
    @async_route
    async def post(self):
        """Enrich database schema with additional information"""
        logger.info("Received request to /schema-enrichment endpoint")
        try:
            data = request.json
            connection_payload = data.get("connection_payload")     

            if not connection_payload:
                logger.warning("Missing required parameters in request")
                return jsonify({"error": "Missing 'connection_payload' or 'database_schema'"}), 400
            
            is_valid, error_message = validate_connection_payload(connection_payload)
            if not is_valid:
                logger.warning(f"Invalid connection payload: {error_message}")
                return jsonify({"error": error_message}), 400
            
            logger.info("Retrieving database schema...")
            table_details = get_schema(connection_payload)
            logger.info(f"Retrieved schema with {len(table_details)} tables")

            logger.info("Executing workflow")
            response = await schema_workflow.run(
                connection_payload=connection_payload,
                database_schema=table_details
            )
            logger.info("Workflow completed successfully")
            response["original_schema"] = get_schema(connection_payload)
            return ResponseWrapper.success(response)
            logger.info("Executing workflow")
            response = await schema_workflow.run(
                connection_payload=connection_payload,
                database_schema=table_details
            )
            logger.info("Workflow completed successfully")
            response["original_schema"] = get_schema(connection_payload)
            return ResponseWrapper.success(response)

        except Exception as e:
            logger.error(f"Error processing schema enrichment: {str(e)}", exc_info=True)
            raise AppException(str(e), 500)
        except Exception as e:
            logger.error(f"Error processing schema enrichment: {str(e)}", exc_info=True)
            raise AppException(str(e), 500)

@api.route('/settings')
class Settings(Resource):
    @api.doc('get_settings',
        responses={
            200: 'Success',
            500: 'Internal Server Error'
        }
    )
    def get(self):
        """Get current LLM settings"""
        logger.info("Received request to view current LLM settings")
        try:
            settings = llm_config.get_settings()
            # Add current provider to the response
            settings["provider"] = os.getenv("LLM_PROVIDER", "ollama").lower()
            return ResponseWrapper.success(settings)
        except Exception as e:
            logger.error(f"Error retrieving settings: {str(e)}", exc_info=True)
            raise AppException(str(e), 500)

    @api.expect(settings_model)
    @api.doc('update_settings',
        responses={
            200: 'Success',
            400: 'Bad Request - Invalid settings',
            500: 'Internal Server Error'
        }
    )
    def post(self):
        """Update LLM settings"""
        logger.info("Received request to update LLM settings")
        try:
            data = request.json
            
            # Get current provider and check if it's being changed
            current_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
            new_provider = data.get("provider", current_provider).lower()
            
            # If provider is changing, validate the new provider
            if new_provider != current_provider:
                if new_provider not in ["ollama", "google"]:
                    raise ValueError(f"Unsupported LLM provider: {new_provider}")
                
                # Update the environment variable
                os.environ["LLM_PROVIDER"] = new_provider
                logger.info(f"LLM provider changed from {current_provider} to {new_provider}")
                
                # Create new LLM config with the new provider
                global llm_config
                llm_config = LLMFactory.create_llm_config(new_provider)
            
            # Extract common settings
            prompt_routing = data.get("prompt_routing")
            enrich_schema = data.get("enrich_schema")
            
            # Extract provider-specific settings
            if new_provider == "ollama":
                settings = {
                    "host": data.get("ollama_host"),
                    "model": data.get("ollama_model"),
                    "additional_kwargs": data.get("additional_kwargs"),
                    "prompt_routing": prompt_routing,
                    "enrich_schema": enrich_schema
                }
            elif new_provider == "google":
                settings = {
                    "model": data.get("model"),
                    "api_key": data.get("api_key"),
                    "temperature": data.get("temperature"),
                    "max_tokens": data.get("max_tokens"),
                    "prompt_routing": prompt_routing,
                    "enrich_schema": enrich_schema
                }
            
            # Validate that at least one setting is provided
            if all(v is None for v in settings.values()):
                logger.warning("No settings provided in request")
                return jsonify({"error": "At least one setting must be provided"}), 400
            
            # Update settings using the centralized LLM config
            llm_config.update_settings(**settings)
            
            # Reinitialize workflows with new LLM
            TEXT_TO_SQL_PROMPT_TMPL = text2sql_prompt_routing(llm_config.settings["prompt_routing"])
            workflow.llm = llm_config.get_llm()
            schema_workflow.llm = llm_config.get_llm()
            baseline_workflow.llm = llm_config.get_llm()
            
            logger.info("LLM settings updated successfully")
            return ResponseWrapper.success({
                "message": "Settings updated successfully",
                "current_settings": llm_config.get_settings(),
                "provider": new_provider
            })
        except Exception as e:
            logger.error(f"Error updating settings: {str(e)}", exc_info=True)
            raise AppException(str(e), 500)

@api.route('/health-check')
class HealthCheck(Resource):
    @api.doc('health_check',
        responses={
            200: 'Success'
        }
    )
    def get(self):
        """Health check endpoint"""
        logger.debug("Health check request received")
        return jsonify({"status": "ok"})

if __name__ == '__main__':
    print_banner()
    logger.info(f"Starting Flask application on port {SERVICE_PORT}")
    app.run(host='0.0.0.0', port=SERVICE_PORT, debug=True)