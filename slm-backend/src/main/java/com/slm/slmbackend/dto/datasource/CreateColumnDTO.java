package com.slm.slmbackend.dto.datasource;

import lombok.Data;

@Data
public class CreateColumnDTO {
    private String columnIdentifier;
    private String columnType;
    private String columnDescription;
    private Boolean isPrimaryKey;
}
