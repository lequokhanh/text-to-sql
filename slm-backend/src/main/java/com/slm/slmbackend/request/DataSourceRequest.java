package com.slm.slmbackend.request;

import com.slm.slmbackend.entity.DataSource.DatabaseType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DataSourceRequest {
    @NotNull
    private DatabaseType databaseType;
    @NotNull
    private String host;
    @NotNull
    private Integer port;
    @NotNull
    private String databaseName;
    @NotNull
    private String username;
    @NotNull
    private String password;
}