import os
import atexit
import consul
import socket
from flask import Flask, request, jsonify
from flask_cors import CORS
from core.workflow import SQLAgentWorkflow
from core.templates import TEXT_TO_SQL_TMPL, TABLE_RETRIEVAL_TMPL
from core.services import get_schema
from llama_index.llms.ollama import Ollama
from llama_index.llms.openai_like import OpenAILike
from core.services import validate_connection_payload
from exceptions.global_exception_handler import register_error_handlers
from exceptions.app_exception import AppException
from response.app_response import ResponseWrapper
from dotenv import load_dotenv
from config.consul import ConsulClient
import logging

logging.basicConfig(level=logging.INFO)

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Register error handlers
register_error_handlers(app)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ftisu.ddns.net:9293/ollama/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b-instruct-q8_0")

# Initialize LLM and Workflow
llm = Ollama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_HOST,
    request_timeout=120.0,
    keep_alive=-1,
    additional_kwargs={
        "num_predict": 4096,
        "temperature": 0.7,
    }
)

# llm = OpenAILike(
#     model="Qwen/Qwen2.5-Coder-7B-Instruct-GPTQ-Int8", 
#     api_base="http://prepared-anemone-routinely.ngrok-free.app/v1", 
#     api_key="fake",
#     temperature=0.7,
#     top_p=0.8,
#     repetition_penalty=1.05,
#     max_tokens=512  # Maximum number of tokens to generate
# )

workflow = SQLAgentWorkflow(
    text2sql_prompt=TEXT_TO_SQL_TMPL,
    table_retrieval_prompt=TABLE_RETRIEVAL_TMPL,
    llm=llm,
    verbose=True
)

# Consul client
SERVICE_NAME = os.getenv("SERVICE_NAME", "slm-engine")
SERVICE_ID = f"{SERVICE_NAME}-{socket.gethostname()}"
SERVICE_PORT = 5000

consul_client = ConsulClient().get_client()

def register_service():
    consul_client.agent.service.register(
        name=SERVICE_NAME,
        service_id=SERVICE_ID,
        address=socket.gethostbyname(socket.gethostname()),
        port=SERVICE_PORT,
        check=consul.Check.http(f"http://{socket.gethostbyname(socket.gethostname())}:{SERVICE_PORT}/health-check", interval="10s")
    )
    print(f"Registered {SERVICE_NAME} on Consul")

    def deregister_service():
        consul_client.agent.service.deregister(SERVICE_ID)
        print(f"Deregistered {SERVICE_NAME} from Consul")

    atexit.register(deregister_service)

register_service()


@app.route('/query', methods=['POST'])
async def query():
    try:
        data = request.json
        query = data.get("query")
        connection_payload = data.get("connection_payload")

        if not query or not connection_payload:
            return jsonify({"error": "Missing 'query' or 'connection_payload'"}), 400
        
        is_valid, error_message = validate_connection_payload(connection_payload)
        if not is_valid:
            return jsonify({"error": error_message}), 400

        table_details = get_schema(connection_payload)

        response = await workflow.run(
            query=query,
            table_details=table_details,
            connection_payload=connection_payload
        )
        return ResponseWrapper.success(response)

    except Exception as e:
        raise AppException(str(e), 500)
    
@app.route('/query-with-schema', methods=['POST'])
async def query():
    try:
        data = request.json
        query = data.get("query")
        connection_payload = data.get("connection_payload")
        table_details = data.get("tables")

        if not query or not connection_payload:
            return jsonify({"error": "Missing 'query' or 'connection_payload'"}), 400
        
        is_valid, error_message = validate_connection_payload(connection_payload)
        if not is_valid:
            return jsonify({"error": error_message}), 400

        # table_details = get_schema(connection_payload)

        response = await workflow.run(
            query=query,
            table_details=table_details,
            connection_payload=connection_payload
        )
        return ResponseWrapper.success(response)

    except Exception as e:
        raise AppException(str(e), 500)

    

@app.route('/health-check', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=SERVICE_PORT, debug=True)
