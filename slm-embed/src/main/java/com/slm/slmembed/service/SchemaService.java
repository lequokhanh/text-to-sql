package com.slm.slmembed.service;

import com.slm.slmembed.request.DbConnectionRequest;
import com.slm.slmembed.request.DbConnectionWithQueryRequest;
import com.slm.slmembed.response.DefaultResponse;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PreDestroy;
import javax.sql.DataSource;
import java.io.File;
import java.io.IOException;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SchemaService {

    private static final String MYSQL_DRIVER = "com.mysql.cj.jdbc.Driver";
    private static final String POSTGRESQL_DRIVER = "org.postgresql.Driver";
    private static final String SQLITE_DRIVER = "org.sqlite.JDBC";

    // Connection pool storage using a thread-safe map
    // Key is a combination of connection details, value is the DataSource
    private final Map<String, DataSource> connectionPool = new ConcurrentHashMap<>();

    /**
     * Creates a unique key for identifying connections
     */
    private String createConnectionKey(String url, String username, String driverClassName) {
        return driverClassName + ":" + url + ":" + username;
    }

    /**
     * Gets or creates a DataSource based on connection parameters
     */
    private DataSource getOrCreateDataSource(String url, String username, String password, String driverClassName) {
        String connectionKey = createConnectionKey(url, username, driverClassName);

        // Return existing connection if it exists
        if (connectionPool.containsKey(connectionKey)) {
            log.info("Using existing connection for {}", connectionKey);
            return connectionPool.get(connectionKey);
        }

        // Create a new connection if none exists
        log.info("Creating new connection for {}", connectionKey);
        HikariConfig hikariConfig = new HikariConfig();

        String jdbcUrl;
        switch (driverClassName) {
            case MYSQL_DRIVER -> jdbcUrl = "jdbc:mysql://" + url;
            case POSTGRESQL_DRIVER -> jdbcUrl = "jdbc:postgresql://" + url;
            case SQLITE_DRIVER -> jdbcUrl = "jdbc:sqlite:" + url;
            default -> jdbcUrl = url;
        }

        hikariConfig.setJdbcUrl(jdbcUrl);

        if (!SQLITE_DRIVER.equals(driverClassName)) {
            hikariConfig.setUsername(username);
            hikariConfig.setPassword(password);
        }

        hikariConfig.setDriverClassName(driverClassName);

        // Configure connection pool settings
        hikariConfig.setMaximumPoolSize(5);
        hikariConfig.setMinimumIdle(1);
        hikariConfig.setIdleTimeout(300000); // 5 minutes
        hikariConfig.setConnectionTimeout(30000); // 30 seconds

        DataSource dataSource = new HikariDataSource(hikariConfig);
        connectionPool.put(connectionKey, dataSource);
        return dataSource;
    }

    /**
     * Clean up all connections when the service is destroyed
     */
    @PreDestroy
    public void cleanupConnections() {
        log.info("Closing all database connections");
        for (DataSource dataSource : connectionPool.values()) {
            closeDataSource(dataSource);
        }
        connectionPool.clear();
    }

    /**
     * Entry point to retrieve database schema
     */
    public DefaultResponse getDatabaseSchema(DbConnectionRequest request) {
        String dbType = request.getDbType().toLowerCase();

        try {
            switch (dbType) {
                case "mysql":
                    return getDatabaseSchemaInternal(request, MYSQL_DRIVER);
                case "postgresql":
                    return getDatabaseSchemaInternal(request, POSTGRESQL_DRIVER);
                default:
                    return new DefaultResponse()
                            .setStatusCode(400)
                            .setMessage("Unsupported database type: " + request.getDbType())
                            .setData(null);
            }
        } catch (Exception e) {
            log.error("Failed to retrieve schema: ", e);
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Failed to retrieve schema: " + e.getMessage())
                    .setData(null);
        }
    }

    /**
     * Common implementation for MySQL and PostgreSQL schema retrieval
     */
    private DefaultResponse getDatabaseSchemaInternal(DbConnectionRequest request, String driver) {
        Map<String, Object> schema = new HashMap<>();

        try {
            DataSource dataSource = getOrCreateDataSource(
                    request.getUrl(), request.getUsername(), request.getPassword(), driver);

            try (var connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                log.info("Connected to {} {}", metaData.getDatabaseProductName(), metaData.getDatabaseProductVersion());

                schema.put("database", connection.getCatalog());

                List<Map<String, Object>> tablesList = new ArrayList<>();

                try (ResultSet tables = metaData.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"})) {
                    while (tables.next()) {
                        String tableName = tables.getString("TABLE_NAME");
                        log.debug("Processing table: {}", tableName);

                        Map<String, Object> tableMap = new HashMap<>();
                        tableMap.put("tableIdentifier", tableName);

                        Map<String, List<Map<String, String>>> foreignKeys = new HashMap<>();

                        try (ResultSet fkResult = metaData.getImportedKeys(connection.getCatalog(), null, tableName)) {
                            while (fkResult.next()) {
                                String columnName = fkResult.getString("FKCOLUMN_NAME");
                                Map<String, String> relation = new HashMap<>();
                                relation.put("toColumn", fkResult.getString("PKCOLUMN_NAME"));
                                relation.put("tableIdentifier", fkResult.getString("PKTABLE_NAME"));
                                relation.put("type", "OTM");

                                foreignKeys.computeIfAbsent(columnName, k -> new ArrayList<>()).add(relation);
                            }
                        }

                        List<Map<String, Object>> columnsList = new ArrayList<>();

                        try (ResultSet columns = metaData.getColumns(connection.getCatalog(), null, tableName, "%")) {
                            while (columns.next()) {
                                Map<String, Object> columnMap = new HashMap<>();
                                String columnName = columns.getString("COLUMN_NAME");

                                columnMap.put("columnIdentifier", columnName);
                                columnMap.put("columnType", columns.getString("TYPE_NAME") + "(" + columns.getInt("COLUMN_SIZE") + ")");
                                columnMap.put("isPrimaryKey", isPrimaryKey(metaData, connection.getCatalog(), tableName, columnName));
                                columnMap.put("columnDescription", Optional.ofNullable(columns.getString("REMARKS")).orElse(""));
                                columnMap.put("relations", foreignKeys.getOrDefault(columnName, new ArrayList<>()));

                                columnsList.add(columnMap);
                            }
                        }

                        tableMap.put("columns", columnsList);
                        tablesList.add(tableMap);
                    }
                }

                schema.put("tables", tablesList);
            }

            return new DefaultResponse()
                    .setStatusCode(200)
                    .setMessage("Schema retrieved successfully")
                    .setData(schema);
        } catch (Exception e) {
            log.error("Schema retrieval error: ", e);
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Failed to retrieve schema: " + e.getMessage())
                    .setData(null);
        }
    }

    private boolean isPrimaryKey(DatabaseMetaData metaData, String catalog, String tableName, String columnName) throws SQLException {
        try (ResultSet primaryKeys = metaData.getPrimaryKeys(catalog, null, tableName)) {
            while (primaryKeys.next()) {
                if (columnName.equals(primaryKeys.getString("COLUMN_NAME"))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Implementation for SQLite schema retrieval
     */
    public DefaultResponse getDatabaseSchemaSQLite(MultipartFile file) {
        Map<String, Object> schema = new HashMap<>();
        DataSource dataSource = null;
        File tempFile = null;

        try {
            tempFile = File.createTempFile("sqlite_db", ".db");
            file.transferTo(tempFile);
            String url = tempFile.getAbsolutePath();

            // For SQLite files, use the file path as the key
            dataSource = getOrCreateDataSource(url, null, null, SQLITE_DRIVER);

            try (var connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                log.info("Connected to {} {}", metaData.getDatabaseProductName(), metaData.getDatabaseProductVersion());

                schema.put("database", tempFile.getAbsolutePath());

                List<Map<String, Object>> tablesList = new ArrayList<>();
                try (var statement = connection.createStatement();
                     var resultSet = statement.executeQuery(
                             "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")) {
                    while (resultSet.next()) {
                        String tableName = resultSet.getString("name");
                        log.debug("Processing SQLite table: {}", tableName);

                        Map<String, Object> tableMap = new HashMap<>();
                        tableMap.put("tableIdentifier", tableName);

                        List<Map<String, Object>> columnsList = new ArrayList<>();
                        Map<String, List<Map<String, String>>> foreignKeys = new HashMap<>();

                        try (var fkStatement = connection.createStatement();
                             var fkResult = fkStatement.executeQuery("PRAGMA foreign_key_list(" + tableName + ")")) {
                            while (fkResult.next()) {
                                String fromColumn = fkResult.getString("from");
                                Map<String, String> foreignKeyMap = new HashMap<>();
                                foreignKeyMap.put("toColumn", fkResult.getString("to"));
                                foreignKeyMap.put("tableIdentifier", fkResult.getString("table"));
                                foreignKeyMap.put("type", "OTM");

                                foreignKeys.computeIfAbsent(fromColumn, k -> new ArrayList<>()).add(foreignKeyMap);
                            }
                        }

                        try (var pragmaStatement = connection.createStatement();
                             var pragmaResult = pragmaStatement.executeQuery("PRAGMA table_info(" + tableName + ")")) {
                            while (pragmaResult.next()) {
                                Map<String, Object> columnMap = new HashMap<>();
                                String columnName = pragmaResult.getString("name");
                                columnMap.put("columnIdentifier", columnName);
                                columnMap.put("columnType", pragmaResult.getString("type"));
                                columnMap.put("isPrimaryKey", pragmaResult.getInt("pk") == 1);
                                columnMap.put("columnDescription",
                                        Optional.ofNullable(pragmaResult.getString("dflt_value"))
                                                .orElse(""));

                                columnMap.put("relations", foreignKeys.getOrDefault(columnName, new ArrayList<>()));

                                columnsList.add(columnMap);
                            }
                        }

                        tableMap.put("columns", columnsList);
                        tablesList.add(tableMap);
                    }
                }
                schema.put("tables", tablesList);
            }

            return new DefaultResponse()
                    .setStatusCode(200)
                    .setMessage("SQLite schema retrieved successfully")
                    .setData(schema);
        } catch (Exception e) {
            log.error("SQLite schema retrieval error: ", e);
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Failed to retrieve SQLite schema: " + e.getMessage())
                    .setData(null);
        } finally {
            // For SQLite, we need to handle temporary files but keep connections in pool
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    /**
     * Entry point for executing queries on databases
     */
    public DefaultResponse queryDatabase(DbConnectionWithQueryRequest request) {
        String dbType = request.getDbType().toLowerCase();
        String query = request.getQuery();

        // Validate query
        if (!isValidSQLQuery(query)) {
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Invalid or unsafe SQL query")
                    .setData(null);
        }

        // Execute query based on database type
        try {
            switch (dbType) {
                case "mysql":
                    return executeQuery(request, query, MYSQL_DRIVER);
                case "postgresql":
                    return executeQuery(request, query, POSTGRESQL_DRIVER);
                default:
                    return new DefaultResponse()
                            .setStatusCode(400)
                            .setMessage("Unsupported database type: " + request.getDbType())
                            .setData(null);
            }
        } catch (Exception e) {
            log.error("Query execution error: ", e);
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Failed to execute query: " + e.getMessage())
                    .setData(null);
        }
    }

    /**
     * Common implementation for executing queries (MySQL/PostgreSQL)
     */
    private DefaultResponse executeQuery(DbConnectionRequest request, String query, String driver) {
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            DataSource dataSource = getOrCreateDataSource(
                    request.getUrl(), request.getUsername(), request.getPassword(), driver);

            try (var connection = dataSource.getConnection();
                 var statement = connection.createStatement();
                 var resultSet = statement.executeQuery(query)) {

                int columnCount = resultSet.getMetaData().getColumnCount();

                while (resultSet.next()) {
                    Map<String, Object> row = new HashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.put(resultSet.getMetaData().getColumnName(i), resultSet.getObject(i));
                    }
                    result.add(row);
                }
            }

            return new DefaultResponse()
                    .setStatusCode(200)
                    .setMessage("Query executed successfully")
                    .setData(result);
        } catch (SQLException e) {
            log.error("SQL query execution error: ", e);
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Failed to execute query: " + e.getMessage())
                    .setData(null);
        }
    }

    public DefaultResponse executeQuerySQLite(MultipartFile file, String query) {
        List<Map<String, Object>> result = new ArrayList<>();
        File tempFile = null;

        try {
            // Save the uploaded file to a temporary directory.
            tempFile = File.createTempFile("sqlite_db", ".db");
            file.transferTo(tempFile);

            // Create the SQLite connection URL using the temporary file's absolute path.
            String url = tempFile.getAbsolutePath();
            DataSource dataSource = getOrCreateDataSource(url, null, null, SQLITE_DRIVER);

            try (var connection = dataSource.getConnection();
                 var statement = connection.createStatement();
                 var resultSet = statement.executeQuery(query)) {

                int columnCount = resultSet.getMetaData().getColumnCount();

                while (resultSet.next()) {
                    Map<String, Object> row = new HashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.put(resultSet.getMetaData().getColumnName(i), resultSet.getObject(i));
                    }
                    result.add(row);
                }
            }

            return new DefaultResponse()
                    .setStatusCode(200)
                    .setMessage("SQLite query executed successfully")
                    .setData(result);
        } catch (SQLException e) {
            log.error("SQLite query execution error: ", e);
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Failed to execute SQLite query: " + e.getMessage())
                    .setData(null);
        } catch (IOException e) {
            log.error("Failed to process uploaded file: ", e);
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Failed to process uploaded file: " + e.getMessage())
                    .setData(null);
        } finally {
            // Delete the temporary file after processing but keep connection in pool
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    /**
     * Validate SQL query for security
     * Implements multiple layers of SQL injection prevention
     */
    private boolean isValidSQLQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return false;
        }

        String normalizedQuery = query.trim().toLowerCase();

        // 1. Basic validation - only allow SELECT queries
        if (!normalizedQuery.startsWith("select ")) {
            return false;
        }

        // 2. Check for multiple statements
        if (normalizedQuery.contains(";")) {
            return false;
        }

        // 3. Check for common SQL injection patterns
        String[] blacklistedPatterns = {
                "into outfile",
                "load_file",
                "--",
                "/*",
                "xp_",
                "shutdown",
                "drop",
                "delete",
                "update",
                "insert",
                "exec",
                "execute",
                "waitfor",
                "delay"
        };

        for (String pattern : blacklistedPatterns) {
            if (normalizedQuery.contains(pattern)) {
                return false;
            }
        }

        // 4. Check for balanced quotes and parentheses
        int singleQuotes = 0;
        int doubleQuotes = 0;
        int parentheses = 0;

        for (char c : query.toCharArray()) {
            switch (c) {
                case '\'':
                    singleQuotes++;
                    break;
                case '"':
                    doubleQuotes++;
                    break;
                case '(':
                    parentheses++;
                    break;
                case ')':
                    parentheses--;
                    break;
            }
        }

        return singleQuotes % 2 == 0
                && doubleQuotes % 2 == 0
                && parentheses == 0;
    }

    /**
     * Close the DataSource
     */
    private void closeDataSource(DataSource dataSource) {
        if (dataSource instanceof HikariDataSource) {
            ((HikariDataSource) dataSource).close();
        }
    }

    /**
     * Utility method to get connection pool statistics
     */
    public DefaultResponse getConnectionPoolStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeConnections", connectionPool.size());

        Map<String, Object> connectionDetails = new HashMap<>();
        for (String key : connectionPool.keySet()) {
            DataSource ds = connectionPool.get(key);
            if (ds instanceof HikariDataSource) {
                HikariDataSource hds = (HikariDataSource) ds;
                Map<String, Object> detail = new HashMap<>();
                detail.put("activeConnections", hds.getHikariPoolMXBean().getActiveConnections());
                detail.put("idleConnections", hds.getHikariPoolMXBean().getIdleConnections());
                detail.put("totalConnections", hds.getHikariPoolMXBean().getTotalConnections());
                connectionDetails.put(key, detail);
            }
        }
        stats.put("details", connectionDetails);

        return new DefaultResponse()
                .setStatusCode(200)
                .setMessage("Connection pool statistics")
                .setData(stats);
    }
}