package com.slm.slmbackend.dto.datasource;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class UpdateColumnsDTO {
    @NotEmpty(message = "Columns updates cannot be empty")
    private List<@Valid ColumnUpdate> columns;

    @Data
    public static class ColumnUpdate {
        private Integer tableId;
        private Integer columnId;
        private String columnIdentifier;
        private String columnType;
        private String columnDescription;
        private Boolean isPrimaryKey;
    }
} 