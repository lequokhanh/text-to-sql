import requests
import os
import json
import base64
import argparse
import sys
import time
import tqdm

def get_sqlite_base64(sqlite_path):
    """Read and encode SQLite file as Base64 string"""
    try:
        # Read SQLite file in binary mode
        with open(sqlite_path, 'rb') as f:
            sqlite_binary = f.read()
        
        # Encode binary data as Base64 string
        sqlite_base64 = base64.b64encode(sqlite_binary).decode('utf-8')
        return sqlite_base64, None
    except FileNotFoundError:
        return None, f"SQLite file not found at {sqlite_path}"
    except Exception as e:
        return None, f"Error processing SQLite file: {str(e)}"

def generate_sql_for_question(query, sqlite_base64, api_url="http://localhost:5000/query", timeout=120):
    """Generate SQL for a given question using the API"""
    try:
        # Create connection payload for SQLite
        sqlite_connection_payload = {
            "file": sqlite_base64,
            "dbType": "sqlite"
        }
        
        # Prepare request payload
        payload = {
            "query": query,
            "connection_payload": sqlite_connection_payload
        }

        # Make POST request to the endpoint
        response = requests.post(api_url, json=payload, timeout=timeout)

        # Check response
        if response.status_code == 200:
            result = response.json()
            return result.get("sql"), None
        else:
            return None, f"API Error: {response.status_code}, {response.text}"
    except requests.exceptions.RequestException as e:
        return None, f"Request failed: {str(e)}"
    except Exception as e:
        return None, f"Error: {str(e)}"

def run_spider_test_pipeline(dev_json_path, sqlite_dir, output_file, api_url="http://localhost:5000/query", 
                           start_idx=0, end_idx=None, batch_size=None, delay=1):
    """
    Process all questions in the dev.json file and generate SQL queries
    
    Args:
        dev_json_path: Path to the dev.json file
        sqlite_dir: Directory containing SQLite files (format: {db_id}.sqlite)
        output_file: Path to output the predicted SQL queries
        api_url: API endpoint URL
        start_idx: Start index in dev.json (for resuming)
        end_idx: End index in dev.json (optional)
        batch_size: Number of questions to process (optional)
        delay: Delay between API calls in seconds (to avoid overwhelming the server)
    """
    # Load dev.json data
    try:
        print(f"Loading data from {dev_json_path}...")
        with open(dev_json_path, 'r', encoding='utf-8') as f:
            dev_data = json.load(f)
    except Exception as e:
        print(f"Error loading dev.json: {str(e)}")
        return False
    
    # Calculate indices
    total_questions = len(dev_data)
    print(f"Found {total_questions} questions in {dev_json_path}")
    
    if end_idx is None:
        end_idx = total_questions
    else:
        end_idx = min(end_idx, total_questions)
    
    if batch_size is not None:
        end_idx = min(start_idx + batch_size, end_idx)
    
    # Prepare to process the data
    questions_to_process = dev_data[start_idx:end_idx]
    print(f"Processing questions from index {start_idx} to {end_idx-1} ({len(questions_to_process)} questions)")
    
    # Create output directory if needed
    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
    
    # Create or clear output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("")  # Clear file if it exists
    
    # Create or clear gold file
    gold_file = output_file.replace('predict.sql', 'gold.txt')
    with open(gold_file, 'w', encoding='utf-8') as f:
        f.write("")  # Clear file if it exists
    
    # Dict to store already encoded databases
    db_cache = {}
    
    # Results storage for summary
    results = []
    
    # Process each question
    success_count = 0
    failure_count = 0
    
    for i, item in tqdm.tqdm(enumerate(questions_to_process), total=len(questions_to_process)):
        db_id = item.get("db_id")
        question = item.get("question")
        gold_query = item.get("query", "")  # Original SQL query (for reference only)
        
        if not db_id or not question:
            print(f"Missing db_id or question at index {start_idx + i}")
            failure_count += 1
            results.append({"sql": "", "db_id": db_id, "error": "Missing data"})
            
            # Write empty SQL to output file
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write("\n")
            
            # Write gold query and db_id to gold file
            with open(gold_file, 'a', encoding='utf-8') as f:
                f.write(f"{gold_query}\t{db_id}\n")
            
            continue
        
        print(f"\n[{i+1}/{len(questions_to_process)}] Processing: DB: {db_id}, Question: {question}")
        
        # Get or create the base64 encoding of the SQLite file
        if db_id in db_cache:
            sqlite_base64 = db_cache[db_id]
        else:
            sqlite_path = os.path.join(sqlite_dir, f"{db_id}.sqlite")
            print(f"Reading database from {sqlite_path}")
            sqlite_base64, error = get_sqlite_base64(sqlite_path)
            
            if error:
                print(f"Error with database {db_id}: {error}")
                failure_count += 1
                results.append({"sql": "", "db_id": db_id, "error": error})
                
                # Write empty SQL to output file
                with open(output_file, 'a', encoding='utf-8') as f:
                    f.write("\n")
                
                # Write gold query and db_id to gold file
                with open(gold_file, 'a', encoding='utf-8') as f:
                    f.write(f"{gold_query}\t{db_id}\n")
                
                continue
            
            # Cache the encoding
            db_cache[db_id] = sqlite_base64
        
        # Generate SQL
        print(f"Generating SQL for question: {question}")
        sql, error = generate_sql_for_question(question, sqlite_base64, api_url)
        
        if error:
            print(f"Error generating SQL: {error}")
            failure_count += 1
            results.append({"sql": "", "db_id": db_id, "error": error})
            
            # Write empty SQL to output file
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write("\n")
        else:
            # Success!
            print(f"Generated SQL: {sql}")
            success_count += 1
            results.append({"sql": sql, "db_id": db_id, "error": None})
            
            # Write SQL to output file immediately
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(f"{sql}\n")
            
            print(f"SQL written to {output_file}")
        
        # Write gold query and db_id to gold file
        with open(gold_file, 'a', encoding='utf-8') as f:
            f.write(f"{gold_query}\t{db_id}\n")
        
        # Add delay to avoid overwhelming the server
        if i < len(questions_to_process) - 1 and delay > 0:
            time.sleep(delay)
    
    # Print summary
    print("\n===== Test Summary =====")
    print(f"Total questions processed: {len(questions_to_process)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {failure_count}")
    print(f"Results written to: {output_file}")
    print(f"Gold file written to: {gold_file}")
    print("========================")
    
    # Generate command suggestion for evaluation
    print("\nTo evaluate the results with test-suite-sql-eval, use:")
    print(f"python3 evaluation.py --gold {gold_file} --pred {output_file} --db [database dir] --table [table file] --etype exec")
    
    return success_count > 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Spider Test Pipeline for SQL Generation")
    parser.add_argument("--dev", type=str, default="../spider_data/dev.json", 
                      help="Path to dev.json file")
    parser.add_argument("--sqlite-dir", type=str, default="../spider_data/sqlite_spider", 
                      help="Directory containing SQLite files")
    parser.add_argument("--output", type=str, default="predict.sql", 
                      help="Output file for predicted SQL queries")
    parser.add_argument("--api-url", type=str, default="http://localhost:5000/query", 
                      help="API endpoint URL")
    parser.add_argument("--start-idx", type=int, default=0, 
                      help="Start index in dev.json")
    parser.add_argument("--end-idx", type=int, default=None, 
                      help="End index in dev.json")
    parser.add_argument("--batch-size", type=int, default=None, 
                      help="Number of questions to process")
    parser.add_argument("--delay", type=float, default=1.0, 
                      help="Delay between API calls in seconds")
    
    args = parser.parse_args()
    
    print("Spider Test Pipeline")
    print("===================")
    print("This script processes Spider dataset questions and generates SQL using the text-to-SQL API.")
    print(f"Make sure your Flask app is running at {args.api_url}\n")
    
    success = run_spider_test_pipeline(
        dev_json_path=args.dev,
        sqlite_dir=args.sqlite_dir,
        output_file=args.output,
        api_url=args.api_url,
        start_idx=args.start_idx,
        end_idx=args.end_idx,
        batch_size=args.batch_size,
        delay=args.delay
    )
    
    sys.exit(0 if success else 1) 