package com.slm.slmbackend.service.impl;

import com.slm.slmbackend.dto.datasource.CreateDataSourceConfigurationDTO;
import com.slm.slmbackend.entity.DataSourceConfiguration;
import com.slm.slmbackend.entity.TableDefinition;
import com.slm.slmbackend.service.TableService;

import java.util.List;

public class TableServiceImpl implements TableService {
    @Override
    public void createTable(DataSourceConfiguration dataSource, List<CreateDataSourceConfigurationDTO.TableDefinition> tableDefinitions) {

    }
}
