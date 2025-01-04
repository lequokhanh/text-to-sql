#!/bin/bash

CONSUL_URL=${CONSUL_HTTP_ADDR}
POSTGRES_SERVICE_NAME="postgres"
POSTGRES_PORT=5432
RETRY_COUNT=5
RETRY_DELAY=5

echo "Registering PostgreSQL with Consul at $CONSUL_URL..."

# Get the hostname or IP address
HOST_IP=$(hostname -i)
if [ -z "$HOST_IP" ]; then
  echo "Failed to determine host IP address." >&2
  exit 1
fi

for i in $(seq 1 $RETRY_COUNT); do
  curl -X PUT "${CONSUL_URL}/v1/agent/service/register" \
      -H "Content-Type: application/json" \
      -d "{
    \"Name\": \"${POSTGRES_SERVICE_NAME}\",
    \"Tags\": [\"database\", \"sql\"],
    \"Address\": \"${HOST_IP}\",
    \"Port\": ${POSTGRES_PORT},
    \"Check\": {
      \"Name\": \"PostgreSQL TCP Check\",
      \"TCP\": \"${HOST_IP}:${POSTGRES_PORT}\",
      \"Interval\": \"10s\",
      \"Timeout\": \"5s\"
    }
  }"
  
  if [ $? -eq 0 ]; then
    echo "PostgreSQL successfully registered with Consul."
    exit 0
  else
    echo "Failed to register PostgreSQL with Consul. Retrying in $RETRY_DELAY seconds..."
    sleep $RETRY_DELAY
  fi
done

echo "Failed to register PostgreSQL with Consul after $RETRY_COUNT attempts." >&2
exit 1
