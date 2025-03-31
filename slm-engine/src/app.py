import os
import atexit
import socket
from flask import Flask, request, jsonify
from flask_cors import CORS
from core.workflow import SQLAgentWorkflow
from core.templates import text2sql_prompt_routing, TABLE_RETRIEVAL_TMPL
from core.services import get_schema
from llama_index.llms.ollama import Ollama
from llama_index.llms.openai_like import OpenAILike
from core.services import validate_connection_payload
from exceptions.global_exception_handler import register_error_handlers
from exceptions.app_exception import AppException
from response.app_response import ResponseWrapper
from dotenv import load_dotenv
import logging
from pathlib import Path

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

# Initialize Flask app
app = Flask(__name__)
CORS(app)
logger.info("Flask app initialized with CORS support")

# Register error handlers
register_error_handlers(app)
logger.info("Error handlers registered")

# Load configuration with better error handling
OLLAMA_HOST = os.getenv("OLLAMA_HOST")
if not OLLAMA_HOST:
    logger.warning("OLLAMA_HOST not found in environment, using default")
    OLLAMA_HOST = "http://ftisu.ddns.net:9293/ollama/"

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
if not OLLAMA_MODEL:
    logger.warning("OLLAMA_MODEL not found in environment, using default")
    OLLAMA_MODEL = "llama3.1:8b-instruct-q8_0"

SERVICE_NAME = os.getenv("SERVICE_NAME")
if not SERVICE_NAME:
    logger.warning("SERVICE_NAME not found in environment, using default")
    SERVICE_NAME = "slm-engine"

SERVICE_PORT = int(os.getenv("SERVICE_PORT", 5000))

# Log all configuration values
logger.info("Configuration loaded:")
logger.info(f"OLLAMA_HOST: {OLLAMA_HOST}")
logger.info(f"OLLAMA_MODEL: {OLLAMA_MODEL}")
logger.info(f"SERVICE_NAME: {SERVICE_NAME}")
logger.info(f"SERVICE_PORT: {SERVICE_PORT}")

# Initialize LLM
logger.info("Initializing LLM client...")
llm = Ollama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_HOST,
    request_timeout=120.0,
    keep_alive=30*60,
    additional_kwargs={
        "num_predict": 4096,
        "temperature": 0.7,
    }
)
logger.info("LLM client initialized successfully")

# Initialize workflow
logger.info("Initializing SQL Agent Workflow...")

TEXT_TO_SQL_PROMPT_TMPL = text2sql_prompt_routing(1)

workflow = SQLAgentWorkflow(
    text2sql_prompt=TEXT_TO_SQL_PROMPT_TMPL,
    table_retrieval_prompt=TABLE_RETRIEVAL_TMPL,
    llm=llm,
    verbose=True
)
logger.info("SQL Agent Workflow initialized successfully")

SERVICE_PORT = 5000

@app.route('/query', methods=['POST'])
async def query():
    """Handle regular query endpoint"""
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
        logger.info(f"Retrieved schema with {len(table_details)} tables")

        logger.info("Executing workflow")
        response = await workflow.run(
            query=query,
            table_details=table_details,
            connection_payload=connection_payload
        )
        logger.info("Workflow completed successfully")
        
        return ResponseWrapper.success(response)

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        raise AppException(str(e), 500)
    
@app.route('/query-with-schema', methods=['POST'])
async def query_with_schema():
    """Handle query with provided schema endpoint"""
    logger.info("Received request to /query-with-schema endpoint")
    try:
        data = request.json
        query = data.get("query")
        connection_payload = data.get("connection_payload")
        table_details = data.get("tables")
        logger.info(f"Processing query: {query}")

        if not query or not connection_payload:
            logger.warning("Missing required parameters in request")
            return jsonify({"error": "Missing 'query' or 'connection_payload'"}), 400
        
        if not table_details:
            logger.warning("No table details provided in request")
            return jsonify({"error": "Missing 'tables' in request"}), 400

        is_valid, error_message = validate_connection_payload(connection_payload)
        if not is_valid:
            logger.warning(f"Invalid connection payload: {error_message}")
            return jsonify({"error": error_message}), 400

        logger.info(f"Processing query with {len(table_details)} provided tables")
        response = await workflow.run(
            query=query,
            table_details=table_details,
            connection_payload=connection_payload
        )
        logger.info("Workflow completed successfully")
        
        return ResponseWrapper.success(response)

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        raise AppException(str(e), 500)
    
    
@app.route('/health-check', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.debug("Health check request received")
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    logger.info(f"Starting Flask application on port {SERVICE_PORT}")
    app.run(host='0.0.0.0', port=SERVICE_PORT, debug=True)