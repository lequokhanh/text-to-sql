
CONSUL_URL=${CONSUL_HTTP_ADDR}
MYSQL_SERVICE_NAME="mysql"
MYSQL_PORT=3306
RETRY_COUNT=5
RETRY_DELAY=5

# Get the hostname or IP address with multiple fallback methods
get_ip() {
    # Try hostname command first
    HOST_IP=$(hostname -i 2>/dev/null)

    # If hostname fails, try ip command
    if [ -z "$HOST_IP" ]; then
        HOST_IP=$(ip route get 1 2>/dev/null | awk '{print $7}' | head -1)
    fi

    # If ip command fails, try interface directly
    if [ -z "$HOST_IP" ]; then
        HOST_IP=$(ip addr show eth0 2>/dev/null | grep "inet\b" | awk '{print $2}' | cut -d/ -f1)
    fi

    echo "$HOST_IP"
}

register_with_consul() {
    HOST_IP=$(get_ip)
    if [ -z "$HOST_IP" ]; then
        echo "Failed to determine host IP address using all available methods." >&2
        return 1
    fi

    echo "Detected IP address: $HOST_IP"
    echo "Registering MySQL with Consul at $CONSUL_URL..."

    for i in $(seq 1 $RETRY_COUNT); do
        RESPONSE=$(curl -s -w "%{http_code}" -X PUT "${CONSUL_URL}/v1/agent/service/register" \
            -H "Content-Type: application/json" \
            -d "{
          \"Name\": \"${MYSQL_SERVICE_NAME}\",
          \"Tags\": [\"database\", \"sql\"],
          \"Address\": \"${HOST_IP}\",
          \"Port\": ${MYSQL_PORT},
          \"Check\": {
            \"Name\": \"MySQL TCP Check\",
            \"TCP\": \"${HOST_IP}:${MYSQL_PORT}\",
            \"Interval\": \"10s\",
            \"Timeout\": \"5s\"
          }
        }")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        if [ "$HTTP_CODE" -eq 200 ]; then
            echo "MySQL successfully registered with Consul."
            return 0
        else
            echo "Failed to register MySQL with Consul (HTTP Code: $HTTP_CODE). Retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    done

    echo "Failed to register MySQL with Consul after $RETRY_COUNT attempts." >&2
    return 1
}

# Start registration in the background
register_with_consul &

# Execute the original MySQL entrypoint script
exec docker-entrypoint.sh mysqld