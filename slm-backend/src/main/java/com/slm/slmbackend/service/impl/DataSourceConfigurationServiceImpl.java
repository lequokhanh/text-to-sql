package com.slm.slmbackend.service.impl;

import com.slm.slmbackend.dto.datasource.CreateDataSourceConfigurationDTO;
import com.slm.slmbackend.dto.datasource.DataSourceConfigurationDTO;
import com.slm.slmbackend.dto.datasource.DataSourceConfigurationViewDTO;
import com.slm.slmbackend.dto.datasource.UpdateDataSourceConfigurationDTO;
import com.slm.slmbackend.entity.*;
import com.slm.slmbackend.enums.ResponseEnum;
import com.slm.slmbackend.exception.AppException;
import com.slm.slmbackend.repository.ColumnRelationRepository;
import com.slm.slmbackend.repository.DataSourceConfigurationRepository;
import com.slm.slmbackend.repository.TableDefinitionRepository;
import com.slm.slmbackend.service.DataSourceConfigurationService;
import com.slm.slmbackend.service.IdGenerationService;
import com.slm.slmbackend.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.slm.slmbackend.enums.ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class DataSourceConfigurationServiceImpl implements DataSourceConfigurationService {

    private final DataSourceConfigurationRepository dataSourceConfigurationRepository;
    private final ColumnRelationRepository columnRelationRepository;
    private final IdGenerationService idGenerationService;
    private final TableDefinitionRepository tableDefinitionRepository;
    @Override
    @Transactional
    public void createDataSourceConfiguration(UserAccount user, CreateDataSourceConfigurationDTO createDTO) {
        DataSourceConfiguration configuration = MapperUtil.mapObject(createDTO, DataSourceConfiguration.class);

        List<TableDefinition> tableDefinitions = MapperUtil.mapList(createDTO.getTableDefinitions(), TableDefinition.class);

        List<UserAccount> owners = List.of(user);

        configuration.setCollectionName(createDTO.getName() + "_" + idGenerationService.getNextId("DataSourceConfiguration"))
                .setTableDefinitions(tableDefinitions)
                .setOwners(owners);

        configuration = dataSourceConfigurationRepository.save(configuration);

        Map<String, TableColumn> columnMap = new HashMap<>();
        for (TableDefinition tableDef : configuration.getTableDefinitions()) {
            if (tableDef.getColumns() != null) {
                for (TableColumn column : tableDef.getColumns()) {
                    columnMap.put(tableDef.getTableIdentifier() + "." + column.getColumnIdentifier(), column);
                }
            }
        }

        List<ColumnRelation> columnRelations = new ArrayList<>();

        for (CreateDataSourceConfigurationDTO.TableDefinition tableDef : createDTO.getTableDefinitions()) {
            if (tableDef.getColumns() != null) {
                for (CreateDataSourceConfigurationDTO.TableColumn column : tableDef.getColumns()) {
                    for (CreateDataSourceConfigurationDTO.ColumnRelation relation : column.getRelations()) {
                        TableColumn columnEntity = columnMap.get(tableDef.getTableIdentifier() + "." + column.getColumnIdentifier());
                        TableColumn relatedColumn = columnMap.get(relation.getTableIdentifier() + "." + relation.getToColumn());
                        if (relatedColumn == null) {
                            throw new AppException(ResponseEnum.COLUMN_IN_RELATION_NOT_FOUND);
                        }
                        ColumnRelation columnRelation = new ColumnRelation()
                                .setDataSource(configuration)
                                .setToColumn(relatedColumn)
                                .setFromColumn(columnEntity)
                                .setType(relation.getType());
                        columnRelations.add(columnRelation);
                    }
                }
            }
        }
        columnRelationRepository.saveAll(columnRelations);
    }

    @Override
    public List<DataSourceConfigurationDTO> getAllDataSourceOwnedByUser(UserAccount user) {
        return MapperUtil.mapList(dataSourceConfigurationRepository.findAllByOwnersContains(user), DataSourceConfigurationDTO.class);
    }

    @Override
    public List<DataSourceConfigurationViewDTO> getAllDataSourceAvailableForUser(UserAccount user) {
        return MapperUtil.mapList(dataSourceConfigurationRepository.findAllDataSourceAvailableForUser(user), DataSourceConfigurationViewDTO.class);
    }

    @Override
    public DataSourceConfigurationDTO getDataSourceConfigurationById(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = dataSourceConfigurationRepository.findById(id).orElseThrow(
                () -> new AppException(DATA_SOURCE_CONFIGURATION_NOT_FOUND));
        if (configuration.getOwners().stream().map(UserAccount::getUsername).noneMatch(user.getUsername()::equals)) {
            throw new AppException(ResponseEnum.DATA_SOURCE_NOT_BELONG_TO_USER);
        }
        return MapperUtil.mapObject(configuration, DataSourceConfigurationDTO.class);
    }

    @Override
    public DataSourceConfigurationDTO updateDataSourceConfiguration(UserAccount user, Integer id, UpdateDataSourceConfigurationDTO updateDTO) {
        DataSourceConfiguration configuration = dataSourceConfigurationRepository.findById(id).orElseThrow(
                () -> new AppException(DATA_SOURCE_CONFIGURATION_NOT_FOUND));
        if (configuration.getOwners().stream().map(UserAccount::getUsername).noneMatch(user.getUsername()::equals)) {
            throw new AppException(ResponseEnum.DATA_SOURCE_NOT_BELONG_TO_USER);
        }
        DataSourceConfiguration updatedConfiguration = MapperUtil.mapObject(updateDTO, DataSourceConfiguration.class);
        updatedConfiguration.setId(id);
        return null;
    }

    @Override
    public void deleteDataSourceConfiguration(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = dataSourceConfigurationRepository.findById(id).orElseThrow(
                () -> new AppException(DATA_SOURCE_CONFIGURATION_NOT_FOUND));
        if (configuration.getOwners().stream().map(UserAccount::getUsername).noneMatch(user.getUsername()::equals)) {
            throw new AppException(ResponseEnum.DATA_SOURCE_NOT_BELONG_TO_USER);
        }
        configuration.getOwners().clear();
        dataSourceConfigurationRepository.save(configuration);

        dataSourceConfigurationRepository.delete(configuration);
    }


}