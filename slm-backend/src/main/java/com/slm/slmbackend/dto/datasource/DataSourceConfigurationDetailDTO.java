package com.slm.slmbackend.dto.datasource;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@Accessors(chain = true)
public class DataSourceConfigurationDetailDTO extends DataSourceConfigurationDTO{
    private List<TableDTO> tableDefinitions = new ArrayList<>();
}