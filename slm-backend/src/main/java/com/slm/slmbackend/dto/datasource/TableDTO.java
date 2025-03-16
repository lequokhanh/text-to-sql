package com.slm.slmbackend.dto.datasource;

import java.util.List;

public class TableDTO {
    private Integer id;
    private String tableIdentifier;
    private List<ColumnWithRelationDTO> columns;
}
