FROM mysql:8.0

# Install required packages
RUN microdnf update && microdnf install -y curl hostname iproute && microdnf clean all

# Copy registration script
COPY register-to-consul.sh /usr/local/bin/register-to-consul.sh
RUN sed -i 's/\r$//' /usr/local/bin/register-to-consul.sh && \
    chmod +x /usr/local/bin/register-to-consul.sh

# Expose ports
EXPOSE 3306

ENTRYPOINT ["docker-entrypoint.sh"]
# Start MySQL and register to Consul
CMD ["./usr/local/bin/register-to-consul.sh"]