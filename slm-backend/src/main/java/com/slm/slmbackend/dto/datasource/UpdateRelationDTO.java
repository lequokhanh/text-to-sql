package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.enums.RelationType;
import lombok.Data;

@Data
public class UpdateRelationDTO {
    private RelationType type;
}
