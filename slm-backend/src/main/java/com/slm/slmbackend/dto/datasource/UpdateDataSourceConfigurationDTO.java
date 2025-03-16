package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.enums.DatabaseType;
import lombok.Data;

/**
 * DTO for updating an existing data source configuration
 */
@Data
public class UpdateDataSourceConfigurationDTO {
    private DatabaseType databaseType;
    private String host;
    private Integer port;
    private String databaseName;
    private String username;
    private String password;
    private String collectionName;
}