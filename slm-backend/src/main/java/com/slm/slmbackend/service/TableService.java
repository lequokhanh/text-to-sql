package com.slm.slmbackend.service;

import com.slm.slmbackend.dto.datasource.CreateDataSourceConfigurationDTO;
import com.slm.slmbackend.entity.DataSourceConfiguration;

import java.util.List;

public interface TableService {
    void createTable(DataSourceConfiguration dataSource, List<CreateDataSourceConfigurationDTO.TableDefinition> tableDefinitions);
}
