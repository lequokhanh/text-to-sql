package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.enums.RelationType;
import lombok.Data;

@Data
public class CreateRelationDTO {
    private String toColumn;
    private String tableIdentifier;
    private RelationType type;
}
