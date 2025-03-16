package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.enums.DatabaseType;
import lombok.Data;

/**
 * Data Transfer Object for Data Source Configuration information
 */
@Data
public class DataSourceConfigurationViewDTO {
    private Integer id;
    private DatabaseType databaseType;
    private String name;
}