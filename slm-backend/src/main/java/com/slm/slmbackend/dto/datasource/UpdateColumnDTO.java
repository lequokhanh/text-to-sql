package com.slm.slmbackend.dto.datasource;

import lombok.Data;

@Data
public class UpdateColumnDTO {
    private Integer id;
    private String columnIdentifier;
    private String columnType;
    private String columnDescription;
    private Boolean isPrimaryKey;
}
