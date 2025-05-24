package com.slm.slmbackend.dto.datasource;

import lombok.Data;

@Data
public class UpdateTableDTO {
    private Integer id;
    private String tableIdentifier;
    private String tableDescription;
}
