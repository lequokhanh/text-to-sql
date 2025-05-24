package com.slm.slmbackend.dto.datasource;

import lombok.Data;

@Data
public class CreateTableDTO {
    private String tableIdentifier;
    private String tableDescription;
}
