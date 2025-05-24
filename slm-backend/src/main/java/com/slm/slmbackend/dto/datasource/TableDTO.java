package com.slm.slmbackend.dto.datasource;

import lombok.Data;

import java.util.List;

@Data
public class TableDTO {
    private Integer id;
    private String tableIdentifier;
    private String tableDescription;
    private List<ColumnWithRelationDTO> columns;
}
