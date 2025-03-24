#!/bin/bash
set -e

echo "Creating databases..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE pagila;
    CREATE DATABASE chinook;
    CREATE DATABASE lego;
EOSQL

echo "Importing Pagila database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname pagila -f /docker-entrypoint-initdb.d/pagila.sql

echo "Importing Chinook database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname chinook -f /docker-entrypoint-initdb.d/chinook.sql

echo "Importing Lego database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname lego -f /docker-entrypoint-initdb.d/lego.sql


echo "Database initialization complete."
