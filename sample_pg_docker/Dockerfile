FROM postgres:latest

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

WORKDIR /tmp

RUN apt-get update && apt-get install -y wget && \
    wget https://raw.githubusercontent.com/neondatabase/postgres-sample-dbs/main/pagila.sql && \
    wget https://raw.githubusercontent.com/neondatabase/postgres-sample-dbs/main/chinook.sql && \
    wget https://raw.githubusercontent.com/neondatabase/postgres-sample-dbs/main/lego.sql && \
    wget https://raw.githubusercontent.com/neondatabase/postgres-sample-dbs/main/employees.sql.gz

RUN mkdir -p /docker-entrypoint-initdb.d && \
    cp pagila.sql chinook.sql lego.sql /docker-entrypoint-initdb.d/ && \
    # Rename the compressed file so it doesn't auto-execute
    mv employees.sql.gz /docker-entrypoint-initdb.d/employees.sql.gz.ignore

COPY init-db.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/init-db.sh