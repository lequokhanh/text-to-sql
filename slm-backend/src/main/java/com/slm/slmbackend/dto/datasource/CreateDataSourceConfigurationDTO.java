package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.enums.DatabaseType;
import com.slm.slmbackend.enums.RelationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateDataSourceConfigurationDTO {
    @NotNull(message = "Database type is required")
    private DatabaseType databaseType;

    @NotBlank(message = "Host is required")
    private String host;

    @NotNull(message = "Port is required")
    private Integer port;

    @NotBlank(message = "Database name is required")
    private String databaseName;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Name is required")
    private String name;

    private List<TableDefinition> tableDefinitions;

    @Data
    public static class TableDefinition {
        @NotBlank(message = "Table identifier is required")
        private String tableIdentifier;

        @NotNull(message = "Columns are required")
        private List<TableColumn> columns;
    }

    @Data
    public static class TableColumn {
        @NotBlank(message = "Column identifier is required")
        private String columnIdentifier;

        @NotBlank(message = "Column type is required")
        private String columnType;

        @NotBlank(message = "Column description is required")
        private String columnDescription;

        @NotNull(message = "Primary key is required")
        private Boolean isPrimaryKey;
        private List<ColumnRelation> relations;
    }

    @Data
    public static class ColumnRelation {
        @NotBlank(message = "Table identifier is required")
        private String tableIdentifier;

        @NotBlank(message = "Column related to is required")
        private String toColumn;

        @NotNull(message = "Relation type is required")
        private RelationType type;
    }
}
