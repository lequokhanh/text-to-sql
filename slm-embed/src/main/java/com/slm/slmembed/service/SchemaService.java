package com.slm.slmembed.service;

import com.slm.slmembed.request.DbConnectionRequest;
import com.slm.slmembed.request.DbConnectionWithQueryRequest;
import com.slm.slmembed.response.DefaultResponse;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.DataSource;
import java.io.File;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class SchemaService {

    private static final String MYSQL_DRIVER = "com.mysql.cj.jdbc.Driver";
    private static final String POSTGRESQL_DRIVER = "org.postgresql.Driver";
    private static final String SQLITE_DRIVER = "org.sqlite.JDBC";

    /**
     * Creates a DataSource based on connection parameters
     */
    private DataSource createDataSource(String url, String username, String password, String driverClassName) {
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl(url);

        // SQLite doesn't require username/password
        if (!SQLITE_DRIVER.equals(driverClassName)) {
            hikariConfig.setUsername(username);
            hikariConfig.setPassword(password);
        }

        hikariConfig.setDriverClassName(driverClassName);
        return new HikariDataSource(hikariConfig);
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
        DataSource dataSource = null;

        try {
            dataSource = createDataSource(request.getUrl(), request.getUsername(), request.getPassword(), driver);

            try (var connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                log.info("Connected to {} {}", metaData.getDatabaseProductName(), metaData.getDatabaseProductVersion());

                // Set the database name
                schema.put("database", connection.getCatalog());

                // Get all tables
                ResultSet tables = metaData.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"});
                List<Map<String, Object>> tablesList = new ArrayList<>();

                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    log.debug("Processing table: {}", tableName);

                    Map<String, Object> tableMap = new HashMap<>();
                    tableMap.put("name", tableName);

                    // Get primary keys
                    List<String> primaryKeyList = new ArrayList<>();
                    try (ResultSet primaryKeys = metaData.getPrimaryKeys(connection.getCatalog(), null, tableName)) {
                        while (primaryKeys.next()) {
                            primaryKeyList.add(primaryKeys.getString("COLUMN_NAME"));
                        }
                        tableMap.put("primary_keys", primaryKeyList);
                    }

                    // Get foreign keys
                    List<Map<String, String>> foreignKeyList = new ArrayList<>();
                    try (ResultSet foreignKeys = metaData.getImportedKeys(connection.getCatalog(), null, tableName)) {
                        while (foreignKeys.next()) {
                            Map<String, String> foreignKeyMap = new HashMap<>();
                            foreignKeyMap.put("column", foreignKeys.getString("FKCOLUMN_NAME"));
                            foreignKeyMap.put("references", foreignKeys.getString("PKTABLE_NAME") + "." + foreignKeys.getString("PKCOLUMN_NAME"));
                            foreignKeyList.add(foreignKeyMap);
                        }
                        tableMap.put("foreign_keys", foreignKeyList);
                    }

                    // Get columns
                    List<Map<String, Object>> columnsList = new ArrayList<>();
                    try (ResultSet columns = metaData.getColumns(connection.getCatalog(), null, tableName, "%")) {
                        while (columns.next()) {
                            Map<String, Object> columnMap = new HashMap<>();
                            columnMap.put("name", columns.getString("COLUMN_NAME"));
                            columnMap.put("dtype", columns.getString("TYPE_NAME") + "(" + columns.getInt("COLUMN_SIZE") + ")");

                            List<String> constraints = new ArrayList<>();
                            if (columns.getInt("NULLABLE") == DatabaseMetaData.columnNoNulls) {
                                constraints.add("NOT NULL");
                            }
                            columnMap.put("constraints", constraints);
                            columnMap.put("description", columns.getString("REMARKS"));
                            columnsList.add(columnMap);
                        }
                        tableMap.put("columns", columnsList);
                    }

                    tablesList.add(tableMap);
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
        } finally {
            closeDataSource(dataSource);
        }
    }

    /**
     * Implementation for SQLite schema retrieval
     */
    public DefaultResponse getDatabaseSchemaSQLite(MultipartFile file) {
        Map<String, Object> schema = new HashMap<>();
        DataSource dataSource = null;
        File tempFile = null;

        try {
            // Save the MultipartFile to a temporary file
            tempFile = File.createTempFile("sqlite_db", ".db");
            file.transferTo(tempFile);
            String url = "jdbc:sqlite:" + tempFile.getAbsolutePath();

            dataSource = createDataSource(url, null, null, SQLITE_DRIVER);

            try (var connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                log.info("Connected to {} {}", metaData.getDatabaseProductName(), metaData.getDatabaseProductVersion());

                schema.put("database", tempFile.getAbsolutePath());

                // Get all tables
                List<Map<String, Object>> tablesList = new ArrayList<>();
                try (var statement = connection.createStatement();
                     var resultSet = statement.executeQuery(
                             "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")) {
                    while (resultSet.next()) {
                        String tableName = resultSet.getString("name");
                        log.debug("Processing SQLite table: {}", tableName);

                        Map<String, Object> tableMap = new HashMap<>();
                        tableMap.put("name", tableName);

                        // Get table info
                        List<Map<String, Object>> columnsList = new ArrayList<>();
                        try (var pragmaStatement = connection.createStatement();
                             var pragmaResult = pragmaStatement.executeQuery("PRAGMA table_info(" + tableName + ")")) {
                            List<String> primaryKeyList = new ArrayList<>();

                            while (pragmaResult.next()) {
                                Map<String, Object> columnMap = new HashMap<>();
                                String columnName = pragmaResult.getString("name");
                                columnMap.put("name", columnName);
                                columnMap.put("dtype", pragmaResult.getString("type"));

                                List<String> constraints = new ArrayList<>();
                                if (pragmaResult.getInt("notnull") == 1) {
                                    constraints.add("NOT NULL");
                                }

                                if (pragmaResult.getInt("pk") == 1) {
                                    primaryKeyList.add(columnName);
                                    constraints.add("PRIMARY KEY");
                                }

                                columnMap.put("constraints", constraints);
                                columnMap.put("description", pragmaResult.getString("dflt_value"));
                                columnsList.add(columnMap);
                            }
                            tableMap.put("primary_keys", primaryKeyList);
                        }
                        tableMap.put("columns", columnsList);

                        // Get foreign keys
                        List<Map<String, String>> foreignKeyList = new ArrayList<>();
                        try (var fkStatement = connection.createStatement();
                             var fkResult = fkStatement.executeQuery("PRAGMA foreign_key_list(" + tableName + ")")) {
                            while (fkResult.next()) {
                                Map<String, String> foreignKeyMap = new HashMap<>();
                                foreignKeyMap.put("column", fkResult.getString("from"));
                                foreignKeyMap.put("references", fkResult.getString("table") + "." + fkResult.getString("to"));
                                foreignKeyList.add(foreignKeyMap);
                            }
                        }
                        tableMap.put("foreign_keys", foreignKeyList);
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
            closeDataSource(dataSource);
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
        DataSource dataSource = null;

        try {
            dataSource = createDataSource(request.getUrl(), request.getUsername(), request.getPassword(), driver);

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
        } finally {
            closeDataSource(dataSource);
        }
    }

    private DefaultResponse executeQuerySQLite(DbConnectionRequest request, String query) {
        List<Map<String, Object>> result = new ArrayList<>();
        DataSource dataSource = null;

        try {
            dataSource = createDataSource(request.getUrl(), null, null, SQLITE_DRIVER);

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
        } finally {
            closeDataSource(dataSource);
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
                "union",
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
                case '\'': singleQuotes++; break;
                case '"': doubleQuotes++; break;
                case '(': parentheses++; break;
                case ')': parentheses--; break;
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
}