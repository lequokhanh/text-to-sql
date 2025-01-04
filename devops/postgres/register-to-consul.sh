#!/bin/bash

CONSUL_URL=${CONSUL_HTTP_ADDR}
POSTGRES_SERVICE_NAME="postgres"
POSTGRES_PORT=5432

echo "Registering PostgreSQL with Consul at $CONSUL_URL..."

# Register PostgreSQL service
curl -X PUT "${CONSUL_URL}/v1/agent/service/register" \
    -H "Content-Type: application/json" \
    -d "{
  \"Name\": \"${POSTGRES_SERVICE_NAME}\",
  \"Tags\": [\"database\", \"sql\"],
  \"Address\": \"$(hostname -i)\",
  \"Port\": ${POSTGRES_PORT},
  \"Check\": {
    \"Name\": \"PostgreSQL TCP Check\",
    \"TCP\": \"$(hostname -i):${POSTGRES_PORT}\",
    \"Interval\": \"10s\",
    \"Timeout\": \"5s\"
  }
}"

echo "PostgreSQL registered with Consul."
