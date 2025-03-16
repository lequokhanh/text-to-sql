package com.slm.slmbackend.dto.datasource;

import java.util.List;

public class ColumnWithRelationDTO {
    private Integer id;
    private String columnIdentifier;
    private String columnType;
    private String columnDescription;
    private Boolean isPrimaryKey;
    private List<RelationDTO> outgoingRelations;
}
