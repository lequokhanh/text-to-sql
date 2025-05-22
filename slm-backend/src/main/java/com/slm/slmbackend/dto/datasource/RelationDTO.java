package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.enums.RelationType;
import lombok.Data;

@Data
public class RelationDTO {
    private Integer id;
    private RelationType type;
    private ColumnDTO toColumn;
}
