package com.slm.slmbackend.dto;

import com.slm.slmbackend.entity.DataSource.DatabaseType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DataSourceDTO {
    private Long id;
    private DatabaseType databaseType;
    private String host;
    private Integer port;
    private String databaseName;
    private String username;
    private String password;
}