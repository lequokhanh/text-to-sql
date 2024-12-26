package com.slm.slmembed.service;

import com.slm.slmembed.request.DbConnectionRequest;
import com.slm.slmembed.response.DefaultResponse;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SchemaService {

    private DataSource createDataSource(String url, String username, String password, String driverClassName) {
        // Create and configure HikariConfig
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl(url);
        hikariConfig.setUsername(username);
        hikariConfig.setPassword(password);
        hikariConfig.setDriverClassName(driverClassName);
        return new HikariDataSource(hikariConfig);
    }

    public DefaultResponse getDatabaseSchema(DbConnectionRequest request) {
        if (request.getDbType().equalsIgnoreCase("mysql")) {
            return getDatabaseSchemaMySQL(request);
        } else if (request.getDbType().equalsIgnoreCase("postgresql")) {
            return getDatabaseSchemaPostgreSQL(request);
        } else {
            return new DefaultResponse()
                    .setStatusCode(400)
                    .setMessage("Invalid database type")
                    .setData(null);
        }
    }

    public DefaultResponse getDatabaseSchemaPostgreSQL(DbConnectionRequest request) {
        Map<String, Object> schema = new HashMap<>();

        try {
            DataSource dataSource = createDataSource(request.getUrl(),
                    request.getUsername(),
                    request.getPassword(),
                    "org.postgresql.Driver");

            try (var connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                System.out.println("Connected to " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());

                // Set the database name
                schema.put("database", connection.getCatalog());

                // Get all tables
                ResultSet tables = metaData.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"});
                List<Map<String, Object>> tablesList = new ArrayList<>();

                while (tables.next()) {
                    System.out.println("Table: " + tables.getString("TABLE_NAME"));
                    Map<String, Object> tableMap = new HashMap<>();
                    String tableName = tables.getString("TABLE_NAME");
                    tableMap.put("name", tableName);

                    // Get primary keys
                    ResultSet primaryKeys = metaData.getPrimaryKeys(connection.getCatalog(), null, tableName);
                    List<String> primaryKeyList = new ArrayList<>();
                    while (primaryKeys.next()) {
                        primaryKeyList.add(primaryKeys.getString("COLUMN_NAME"));
                    }
                    tableMap.put("primary_keys", primaryKeyList);

                    // Get foreign keys
                    ResultSet foreignKeys = metaData.getImportedKeys(connection.getCatalog(), null, tableName);
                    List<Map<String, String>> foreignKeyList = new ArrayList<>();
                    while (foreignKeys.next()) {
                        Map<String, String> foreignKeyMap = new HashMap<>();
                        foreignKeyMap.put("column", foreignKeys.getString("FKCOLUMN_NAME"));
                        foreignKeyMap.put("references", foreignKeys.getString("PKTABLE_NAME") + "." + foreignKeys.getString("PKCOLUMN_NAME"));
                        foreignKeyList.add(foreignKeyMap);
                    }
                    tableMap.put("foreign_keys", foreignKeyList);

                    // Get columns and their details
                    ResultSet columns = metaData.getColumns(connection.getCatalog(), null, tableName, "%");
                    List<Map<String, Object>> columnsList = new ArrayList<>();
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

                    tablesList.add(tableMap);
                }
                schema.put("tables", tablesList);
            }
        } catch (Exception e) {
            e.printStackTrace();
            schema.put("error", "Failed to retrieve schema: " + e.getMessage());
        }
        return new DefaultResponse()
                .setStatusCode(200)
                .setMessage("Schema retrieved successfully")
                .setData(schema);
    }

    public DefaultResponse getDatabaseSchemaMySQL(DbConnectionRequest request) {
        Map<String, Object> schema = new HashMap<>();

        try {
            DataSource dataSource = createDataSource(request.getUrl(),
                    request.getUsername(),
                    request.getPassword(),
                    "com.mysql.cj.jdbc.Driver");

            try (var connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                System.out.println("Connected to " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());

                // Set the database name
                schema.put("database", connection.getCatalog());

                // Get all tables (Note: MySQL uses 'BASE TABLE' for regular tables)
                ResultSet tables = metaData.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"});
                List<Map<String, Object>> tablesList = new ArrayList<>();

                while (tables.next()) {
                    System.out.println("Table: " + tables.getString("TABLE_NAME"));
                    Map<String, Object> tableMap = new HashMap<>();
                    String tableName = tables.getString("TABLE_NAME");
                    tableMap.put("name", tableName);

                    // Get primary keys
                    ResultSet primaryKeys = metaData.getPrimaryKeys(connection.getCatalog(), null, tableName);
                    List<String> primaryKeyList = new ArrayList<>();
                    while (primaryKeys.next()) {
                        primaryKeyList.add(primaryKeys.getString("COLUMN_NAME"));
                    }
                    tableMap.put("primary_keys", primaryKeyList);

                    // Get foreign keys
                    ResultSet foreignKeys = metaData.getImportedKeys(connection.getCatalog(), null, tableName);
                    List<Map<String, String>> foreignKeyList = new ArrayList<>();
                    while (foreignKeys.next()) {
                        Map<String, String> foreignKeyMap = new HashMap<>();
                        foreignKeyMap.put("column", foreignKeys.getString("FKCOLUMN_NAME"));
                        foreignKeyMap.put("references", foreignKeys.getString("PKTABLE_NAME") + "." + foreignKeys.getString("PKCOLUMN_NAME"));
                        foreignKeyList.add(foreignKeyMap);
                    }
                    tableMap.put("foreign_keys", foreignKeyList);

                    // Get columns and their details
                    ResultSet columns = metaData.getColumns(connection.getCatalog(), null, tableName, "%");
                    List<Map<String, Object>> columnsList = new ArrayList<>();
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

                    tablesList.add(tableMap);
                }
                schema.put("tables", tablesList);
            }
        } catch (Exception e) {
            e.printStackTrace();
            schema.put("error", "Failed to retrieve schema: " + e.getMessage());
        }
        return new DefaultResponse()
                .setStatusCode(200)
                .setMessage("Schema retrieved successfully")
                .setData(schema);
    }
}
