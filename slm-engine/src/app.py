from flask import Flask, request, jsonify
from core.workflow import SQLAgentWorkflow
from core.templates import TEXT_TO_SQL_TMPL, TABLE_RETRIEVAL_TMPL
from core.services import get_schema
from llama_index.llms.ollama import Ollama
from core.services import validate_connection_payload

# Initialize Flask app
app = Flask(__name__)

# Initialize LLM and Workflow
llm = Ollama(
    model="llama3.1:8b-instruct-q8_0",
    base_url="http://ftisu.ddns.net:9293/ollama/",
    # base_url="https://prepared-anemone-routinely.ngrok-free.app",
    request_timeout=120.0
)

workflow = SQLAgentWorkflow(
    text2sql_prompt=TEXT_TO_SQL_TMPL,
    table_retrieval_prompt=TABLE_RETRIEVAL_TMPL,
    llm=llm,
    verbose=True
)


@app.route('/query', methods=['POST'])
async def query():
    try:
        # Parse request data
        data = request.json
        query = data.get("query")
        connection_payload = data.get("connection_payload")

        if not query or not connection_payload:
            return jsonify({"error": "Missing 'query' or 'connection_payload'"}), 400
        
        # Validate connection payload
        is_valid, error_message = validate_connection_payload(connection_payload)
        if not is_valid:
            return jsonify({"error": error_message}), 400

        # Get schema
        table_details = get_schema(connection_payload)

        # Run workflow
        response = await workflow.run(
            query=query,
            table_details=table_details
        )
        # Return response
        return jsonify({"sql": response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/query_with_schema', methods=['POST'])
async def query_with_schema():
    try:
        # Parse request data
        data = request.json
        query = data.get("query")
        schema = data.get("schema")

        if not query:
            return jsonify({"error": "Missing 'query' parameter"}), 400
        
        if not schema:
            return jsonify({"error": "Missing 'schema' parameter"}), 400
            
        if not isinstance(schema, list):
            return jsonify({"error": "'schema' must be a list of table definitions"}), 400

        # Run workflow with provided schema
        response = await workflow.run(
            query=query,
            table_details=schema
        )
        
        # Return response
        return jsonify({"sql": response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/health-check', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
