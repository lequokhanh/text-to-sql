# Base image for PostgreSQL
FROM postgres:15.4

# Install necessary tools
USER root
RUN apt-get update && apt-get install -y curl jq

# Set environment variables for PostgreSQL
ENV POSTGRES_USER=slm \
    POSTGRES_PASSWORD=slm123 \
    POSTGRES_DB=slm \
    CONSUL_HTTP_ADDR=http://consul:8500

# Add service registration script
COPY register-to-consul.sh /usr/local/bin/register-to-consul.sh
RUN chmod +x /usr/local/bin/register-to-consul.sh

# Switch back to the postgres user to run PostgreSQL
USER postgres

# Run PostgreSQL and register with Consul
CMD ["bash", "-c", "/usr/local/bin/register-to-consul.sh & postgres"]
