FROM postgres:15.4

USER root
RUN apt-get update && apt-get install -y curl jq bash && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV POSTGRES_USER=slm \
    POSTGRES_PASSWORD=slm123 \
    POSTGRES_DB=slm \
    CONSUL_HTTP_ADDR=http://consul:8500

RUN mkdir -p /var/lib/postgresql/data && chown -R postgres:postgres /var/lib/postgresql/data

# Add registration script
COPY register-to-consul.sh /usr/local/bin/register-to-consul.sh
RUN sed -i 's/\r$//' /usr/local/bin/register-to-consul.sh && \
    chmod +x /usr/local/bin/register-to-consul.sh

USER postgres

# Initialize the database directory
RUN initdb -D /var/lib/postgresql/data

ENTRYPOINT ["docker-entrypoint.sh"]
# Ensure the script runs with bash
CMD ["./usr/local/bin/register-to-consul.sh"]
