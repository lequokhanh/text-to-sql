package com.slm.slmbackend.service.impl;

import com.slm.slmbackend.dto.auth.UserAccountDTO;
import com.slm.slmbackend.dto.datasource.*;
import com.slm.slmbackend.entity.*;
import com.slm.slmbackend.enums.ResponseEnum;
import com.slm.slmbackend.exception.AppException;
import com.slm.slmbackend.repository.ColumnRelationRepository;
import com.slm.slmbackend.repository.DataSourceConfigurationRepository;
import com.slm.slmbackend.repository.UserAccountRepository;
import com.slm.slmbackend.service.DataSourceConfigurationService;
import com.slm.slmbackend.service.EmbedService;
import com.slm.slmbackend.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

import static com.slm.slmbackend.enums.ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DataSourceConfigurationServiceImpl implements DataSourceConfigurationService {

    private final DataSourceConfigurationRepository dataSourceConfigurationRepository;
    private final ColumnRelationRepository columnRelationRepository;
    private final UserAccountRepository userAccountRepository;
    private final EmbedService embedService;

    @Override
    @Transactional
    public void createDataSourceConfiguration(UserAccount user, CreateDataSourceConfigurationDTO createDTO) {
        log.debug("Creating new data source configuration: {}", createDTO.getName());
        
        // Map the DTO to entity
        DataSourceConfiguration configuration = MapperUtil.mapObject(createDTO, DataSourceConfiguration.class);
        
        // Map table definitions
        List<TableDefinition> tableDefinitions = MapperUtil.mapList(
                createDTO.getTableDefinitions() != null ? createDTO.getTableDefinitions() : new ArrayList<>(), 
                TableDefinition.class);

        // Set owner
        List<UserAccount> owners = new ArrayList<>();
        owners.add(user);
        // Set all properties
        configuration.setTableDefinitions(tableDefinitions)
                     .setOwners(owners);

        // Save to get IDs assigned
        configuration = dataSourceConfigurationRepository.save(configuration);
        log.debug("Saved data source configuration with ID: {}", configuration.getId());

        // Build a map of columns for easy lookup
        Map<String, TableColumn> columnMap = new HashMap<>();
        for (TableDefinition tableDef : configuration.getTableDefinitions()) {
            if (tableDef.getColumns() != null) {
                for (TableColumn column : tableDef.getColumns()) {
                    columnMap.put(tableDef.getTableIdentifier() + "." + column.getColumnIdentifier(), column);
                }
            }
        }

        // Create relations
        List<ColumnRelation> columnRelations = new ArrayList<>();
        if (createDTO.getTableDefinitions() != null) {
            for (CreateDataSourceConfigurationDTO.TableDefinition tableDef : createDTO.getTableDefinitions()) {
                if (tableDef.getColumns() != null) {
                    for (CreateDataSourceConfigurationDTO.TableColumn column : tableDef.getColumns()) {
                        if (column.getRelations() != null && !column.getRelations().isEmpty()) {
                            for (CreateDataSourceConfigurationDTO.ColumnRelation relation : column.getRelations()) {
                                TableColumn fromColumn = columnMap.get(tableDef.getTableIdentifier() + "." + column.getColumnIdentifier());
                                TableColumn toColumn = columnMap.get(relation.getTableIdentifier() + "." + relation.getToColumn());
                                
                                if (toColumn == null) {
                                    throw new AppException(ResponseEnum.COLUMN_IN_RELATION_NOT_FOUND, 
                                        String.format("Column %s in table %s not found", relation.getToColumn(), relation.getTableIdentifier()));
                                }
                                
                                ColumnRelation columnRelation = new ColumnRelation()
                                        .setDataSource(configuration)
                                        .setFromColumn(fromColumn)
                                        .setToColumn(toColumn)
                                        .setType(relation.getType());
                                
                                columnRelations.add(columnRelation);
                            }
                        }
                    }
                }
            }
        }
        
        if (!columnRelations.isEmpty()) {
            log.debug("Saving {} column relations", columnRelations.size());
            columnRelationRepository.saveAll(columnRelations);
        }
    }

    @Override
    public List<DataSourceConfigurationDTO> getAllDataSourceOwnedByUser(UserAccount user) {
        log.debug("Getting all data sources owned by user: {}", user.getUsername());
        
        List<DataSourceConfiguration> configurations = dataSourceConfigurationRepository.findAllByOwnersContains(user);
        return MapperUtil.mapList(configurations, DataSourceConfigurationDTO.class);
    }

    @Override
    public List<DataSourceConfigurationViewDTO> getAllDataSourceAvailableForUser(UserAccount user) {
        log.debug("Getting all data sources available for user: {}", user.getUsername());
        
        List<DataSourceConfiguration> configurations = dataSourceConfigurationRepository.findAllDataSourceAvailableForUser(user);
        return MapperUtil.mapList(configurations, DataSourceConfigurationViewDTO.class);
    }

    private DataSourceConfiguration validateAndGetDataSource(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = dataSourceConfigurationRepository.findById(id)
                .orElseThrow(() -> new AppException(DATA_SOURCE_CONFIGURATION_NOT_FOUND, 
                    String.format("Data source with ID %d not found", id)));
        
        // Check if user is an owner
        boolean isOwner = configuration.getOwners().stream()
                .anyMatch(owner -> owner.getId().equals(user.getId()));
        
        if (!isOwner) {
            throw new AppException(ResponseEnum.DATA_SOURCE_NOT_BELONG_TO_USER,
                String.format("User %s is not an owner of data source %d", user.getUsername(), id));
        }
        
        return configuration;
    }

    @Override
    public DataSourceConfigurationDetailDTO getDataSourceConfigurationById(UserAccount user, Integer id) {
        log.debug("Getting data source configuration with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);

        // Create the detail DTO
        DataSourceConfigurationDetailDTO detailDTO = new DataSourceConfigurationDetailDTO();
        detailDTO.setId(configuration.getId());
        detailDTO.setDatabaseType(configuration.getDatabaseType());
        detailDTO.setName(configuration.getName());
        detailDTO.setHost(configuration.getHost());
        detailDTO.setPort(configuration.getPort());
        detailDTO.setDatabaseName(configuration.getDatabaseName());
        detailDTO.setUsername(configuration.getUsername());
        detailDTO.setPassword(configuration.getPassword());
        detailDTO.setDatabaseDescription(configuration.getDatabaseDescription());
        // Map the table definitions
        List<TableDTO> tableDTOs = new ArrayList<>();
        if (configuration.getTableDefinitions() != null) {
            for (TableDefinition tableDef : configuration.getTableDefinitions()) {
                TableDTO tableDTO = new TableDTO();
                tableDTO.setId(tableDef.getId());
                tableDTO.setTableIdentifier(tableDef.getTableIdentifier());
                tableDTO.setTableDescription(tableDef.getTableDescription());

                // Map columns for this table
                List<ColumnWithRelationDTO> columnDTOs = new ArrayList<>();
                if (tableDef.getColumns() != null) {
                    for (TableColumn column : tableDef.getColumns()) {
                        ColumnWithRelationDTO columnDTO = new ColumnWithRelationDTO();
                        columnDTO.setId(column.getId());
                        columnDTO.setColumnIdentifier(column.getColumnIdentifier());
                        columnDTO.setColumnType(column.getColumnType());
                        columnDTO.setColumnDescription(column.getColumnDescription());
                        columnDTO.setIsPrimaryKey(column.getIsPrimaryKey());

                        // Map relations for this column
                        List<RelationDTO> relationDTOs = new ArrayList<>();
                        if (column.getOutgoingRelations() != null) {
                            for (ColumnRelation relation : column.getOutgoingRelations()) {
                                RelationDTO relationDTO = new RelationDTO();

                                if (relation.getToColumn() != null) {
                                    // Create ColumnDTO for the target column
                                    ColumnDTO toColumnDTO = new ColumnDTO();
                                    toColumnDTO.setId(relation.getToColumn().getId());
                                    toColumnDTO.setColumnIdentifier(relation.getToColumn().getColumnIdentifier());
                                    toColumnDTO.setColumnType(relation.getToColumn().getColumnType());
                                    toColumnDTO.setColumnDescription(relation.getToColumn().getColumnDescription());
                                    toColumnDTO.setIsPrimaryKey(relation.getToColumn().getIsPrimaryKey());

                                    relationDTO.setToColumn(toColumnDTO);
                                }

                                relationDTO.setId(relation.getId());
                                relationDTO.setType(relation.getType());
                                relationDTOs.add(relationDTO);
                            }
                        }

                        columnDTO.setOutgoingRelations(relationDTOs);
                        columnDTOs.add(columnDTO);
                    }
                }

                tableDTO.setColumns(columnDTOs);
                tableDTOs.add(tableDTO);
            }
        }

        detailDTO.setTableDefinitions(tableDTOs);
        return detailDTO;
    }

    @Override
    public List<UserAccountDTO> getAllOwnersOfDataSourceConfiguration(UserAccount user, Integer id) {
        log.debug("Getting all owners of data source configuration with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        return MapperUtil.mapList(configuration.getOwners(), UserAccountDTO.class);
    }

    @Override
    public List<GroupDTO> getAllGroupsOfDataSourceConfiguration(UserAccount user, Integer id) {
        log.debug("Getting all groups of data source configuration with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        
        if (configuration.getGroups() == null || configuration.getGroups().isEmpty()) {
            return new ArrayList<>();
        }

        return MapperUtil.mapList(configuration.getGroups(), GroupDTO.class);
    }

    @Override
    public GroupDetailDTO getGroupById(UserAccount user, Integer groupId) {
        log.debug("Getting group with ID: {}", groupId);
        
        // Find all data sources available to the user
        List<DataSourceConfiguration> availableDataSources = new ArrayList<>(
                dataSourceConfigurationRepository.findAllByOwnersContains(user));
        
        availableDataSources.addAll(
                dataSourceConfigurationRepository.findAllDataSourceAvailableForUser(user));
        
        // Remove duplicates
        availableDataSources = availableDataSources.stream()
                .distinct()
                .collect(Collectors.toList());

        // Find the group in any of the available data sources
        for (DataSourceConfiguration dataSource : availableDataSources) {
            if (dataSource.getGroups() != null) {
                Optional<UserGroup> foundGroup = dataSource.getGroups().stream()
                        .filter(group -> group.getId().equals(groupId))
                        .findFirst();

                if (foundGroup.isPresent()) {
                    UserGroup group = foundGroup.get();

                    // Map to DTO
                    GroupDetailDTO dto = new GroupDetailDTO();
                    dto.setId(group.getId());
                    dto.setName(group.getName());

                    // Map table IDs
                    if (group.getTableMappings() != null) {
                        List<Integer> tableIds = group.getTableMappings().stream()
                                .filter(mapping -> mapping.getSchema() != null)
                                .map(mapping -> mapping.getSchema().getId())
                                .collect(Collectors.toList());
                        dto.setTableIds(tableIds);
                    } else {
                        dto.setTableIds(new ArrayList<>());
                    }

                    // Map members
                    if (group.getMembers() != null) {
                        dto.setMembers(MapperUtil.mapList(group.getMembers(), UserAccountDTO.class));
                    } else {
                        dto.setMembers(new ArrayList<>());
                    }

                    // Map data source
                    dto.setDataSourceConfiguration(MapperUtil.mapObject(dataSource, DataSourceConfigurationDTO.class));

                    return dto;
                }
            }
        }

        throw new AppException(ResponseEnum.NOT_FOUND.getCode(), 
            String.format("Group with ID %d not found or not accessible", groupId));
    }

    @Override
    public void updateDataSourceConfiguration(UserAccount user, Integer id, UpdateDataSourceConfigurationDTO updateDTO) {
        log.debug("Updating data source configuration with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);

        // Update only non-null fields
        for (Field field : updateDTO.getClass().getDeclaredFields()) {
            field.setAccessible(true);
            try {
                Object value = field.get(updateDTO);
                if (value != null) {
                    Field configField = configuration.getClass().getDeclaredField(field.getName());
                    configField.setAccessible(true);
                    configField.set(configuration, value);
                }
            } catch (NoSuchFieldException | IllegalAccessException e) {
                log.error("Failed to update field: {}", field.getName(), e);
                throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, 
                    String.format("Failed to update field: %s", field.getName()));
            }
        }
        
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void deleteDataSourceConfiguration(UserAccount user, Integer id) {
        log.debug("Deleting data source configuration with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        
        // Clear owners to avoid foreign key constraints
        if (configuration.getOwners() != null) {
            configuration.getOwners().clear();
            dataSourceConfigurationRepository.save(configuration);
        }

        dataSourceConfigurationRepository.delete(configuration);
    }

    @Override
    public void addTableToDataSource(UserAccount user, Integer id, CreateTableDTO tableDTO) {
        log.debug("Adding table to data source with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        
        TableDefinition tableDefinition = MapperUtil.mapObject(tableDTO, TableDefinition.class);
        tableDefinition.setColumns(new ArrayList<>());
        
        if (configuration.getTableDefinitions() == null) {
            configuration.setTableDefinitions(new ArrayList<>());
        }
        
        configuration.getTableDefinitions().add(tableDefinition);
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void updateTable(UserAccount user, Integer id, Integer tableId, UpdateTableDTO tableDTO) {
        log.debug("Updating table with ID: {} in data source with ID: {}", tableId, id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        
        TableDefinition tableDefinition = findTableById(configuration, tableId);
        
        if (tableDTO.getTableIdentifier() != null) 
            tableDefinition.setTableIdentifier(tableDTO.getTableIdentifier());
        if (tableDTO.getTableDescription() != null)
            tableDefinition.setTableDescription(tableDTO.getTableDescription());
        
        dataSourceConfigurationRepository.save(configuration);
    }

    private TableDefinition findTableById(DataSourceConfiguration configuration, Integer tableId) {
        if (configuration.getTableDefinitions() == null) {
            throw new AppException(ResponseEnum.TABLE_NOT_FOUND, 
                String.format("Table with ID %d not found", tableId));
        }
        
        return configuration.getTableDefinitions().stream()
                .filter(table -> table.getId().equals(tableId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND, 
                    String.format("Table with ID %d not found", tableId)));
    }

    @Override
    public void removeTableFromDataSource(UserAccount user, Integer id, Integer tableId) {
        log.debug("Removing table with ID: {} from data source with ID: {}", tableId, id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = findTableById(configuration, tableId);
        
        configuration.getTableDefinitions().remove(tableDefinition);
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void addColumnToTable(UserAccount user, Integer id, Integer tableId, CreateColumnDTO columnDTO) {
        log.debug("Adding column to table with ID: {} in data source with ID: {}", tableId, id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = findTableById(configuration, tableId);
        
        TableColumn column = MapperUtil.mapObject(columnDTO, TableColumn.class);
        column.setOutgoingRelations(new ArrayList<>());
        
        if (tableDefinition.getColumns() == null) {
            tableDefinition.setColumns(new ArrayList<>());
        }
        
        tableDefinition.getColumns().add(column);
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void updateColumn(UserAccount user, Integer id, Integer tableId, Integer columnId, UpdateColumnDTO columnDTO) {
        log.debug("Updating column with ID: {} in table with ID: {} in data source with ID: {}", columnId, tableId, id);
        
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        // Update column properties
        result.column().setColumnIdentifier(columnDTO.getColumnIdentifier());
        result.column().setColumnType(columnDTO.getColumnType());
        result.column().setColumnDescription(columnDTO.getColumnDescription());
        result.column().setIsPrimaryKey(columnDTO.getIsPrimaryKey());

        dataSourceConfigurationRepository.save(result.configuration());
    }

    @Override
    public void removeColumnFromTable(UserAccount user, Integer id, Integer tableId, Integer columnId) {
        log.debug("Removing column with ID: {} from table with ID: {} in data source with ID: {}", columnId, tableId, id);
        
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        result.tableDefinition().getColumns().remove(result.column());
        dataSourceConfigurationRepository.save(result.configuration());
    }

    private ColumnResult getColumnResult(UserAccount user, Integer id, Integer tableId, Integer columnId) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = findTableById(configuration, tableId);

        if (tableDefinition.getColumns() == null) {
            throw new AppException(ResponseEnum.COLUMN_NOT_FOUND, 
                String.format("Column with ID %d not found in table with ID %d", columnId, tableId));
        }
        
        TableColumn column = tableDefinition.getColumns().stream()
                .filter(col -> col.getId().equals(columnId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.COLUMN_NOT_FOUND, 
                    String.format("Column with ID %d not found in table with ID %d", columnId, tableId)));
        
        return new ColumnResult(configuration, tableDefinition, column);
    }

    private record ColumnResult(DataSourceConfiguration configuration, TableDefinition tableDefinition, TableColumn column) {
    }

    @Override
    public void addRelationToColumn(UserAccount user, Integer id, Integer tableId, Integer columnId, CreateRelationDTO relationDTO) {
        log.debug("Adding relation to column with ID: {} in table with ID: {} in data source with ID: {}", columnId, tableId, id);
        
        ColumnResult sourceColumnResult = getColumnResult(user, id, tableId, columnId);
        DataSourceConfiguration configuration = sourceColumnResult.configuration();
        
        // Find target table and column
        TableDefinition targetTableDefinition = configuration.getTableDefinitions().stream()
                .filter(table -> table.getTableIdentifier().equals(relationDTO.getTableIdentifier()))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND, 
                    String.format("Target table %s not found", relationDTO.getTableIdentifier())));

        if (targetTableDefinition.getColumns() == null) {
            throw new AppException(ResponseEnum.COLUMN_NOT_FOUND, 
                String.format("Target column %s not found in table %s", 
                    relationDTO.getToColumn(), relationDTO.getTableIdentifier()));
        }
        
        TableColumn targetColumn = targetTableDefinition.getColumns().stream()
                .filter(col -> col.getColumnIdentifier().equals(relationDTO.getToColumn()))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.COLUMN_NOT_FOUND, 
                    String.format("Target column %s not found in table %s", 
                        relationDTO.getToColumn(), relationDTO.getTableIdentifier())));

        // Create and save the relation
        ColumnRelation columnRelation = new ColumnRelation()
                .setDataSource(configuration)
                .setFromColumn(sourceColumnResult.column())
                .setToColumn(targetColumn)
                .setType(relationDTO.getType());

        if (sourceColumnResult.column().getOutgoingRelations() == null) {
            sourceColumnResult.column().setOutgoingRelations(new ArrayList<>());
        }
        
        // Save the relation
        columnRelation = columnRelationRepository.save(columnRelation);
        
        // Add to outgoing relations
        sourceColumnResult.column().getOutgoingRelations().add(columnRelation);
        
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void updateRelation(UserAccount user, Integer id, Integer tableId, Integer columnId, Integer relationId, UpdateRelationDTO relationDTO) {
        log.debug("Updating relation with ID: {} for column with ID: {} in table with ID: {} in data source with ID: {}", 
            relationId, columnId, tableId, id);
        
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        ColumnRelation columnRelation = columnRelationRepository.findById(relationId)
                .orElseThrow(() -> new AppException(ResponseEnum.RELATION_NOT_FOUND, 
                    String.format("Relation with ID %d not found", relationId)));

        if (!columnRelation.getFromColumn().getId().equals(result.column().getId())) {
            throw new AppException(ResponseEnum.RELATION_NOT_BELONG_TO_COLUMN, 
                String.format("Relation with ID %d does not belong to column with ID %d", relationId, columnId));
        }

        columnRelation.setType(relationDTO.getType());
        columnRelationRepository.save(columnRelation);
    }

    @Override
    public void removeRelationFromColumn(UserAccount user, Integer id, Integer tableId, Integer columnId, Integer relationId) {
        log.debug("Removing relation with ID: {} from column with ID: {} in table with ID: {} in data source with ID: {}", 
            relationId, columnId, tableId, id);
        
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        ColumnRelation columnRelation = columnRelationRepository.findById(relationId)
                .orElseThrow(() -> new AppException(ResponseEnum.RELATION_NOT_FOUND, 
                    String.format("Relation with ID %d not found", relationId)));

        if (!columnRelation.getFromColumn().getId().equals(result.column().getId())) {
            log.info("Id of columnRelation.getFromColumn(): {}", columnRelation.getFromColumn().getId());
            log.info("Id of result.column(): {}", result.column().getId());
            throw new AppException(ResponseEnum.RELATION_NOT_BELONG_TO_COLUMN, 
                String.format("Relation with ID %d does not belong to column with ID %d", relationId, columnId));
        }

        if (result.column().getOutgoingRelations() != null) {
            result.column().getOutgoingRelations().removeIf(relation -> relation.getId().equals(relationId));
        }
        
        columnRelationRepository.delete(columnRelation);
    }

    @Override
    public void addGroupToDataSource(UserAccount user, Integer id, GroupUpsertDTO groupDTO) {
        log.debug("Adding group to data source with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);

        UserGroup userGroup = new UserGroup();
        userGroup.setName(groupDTO.getName());
        userGroup.setDataSourceConfiguration(configuration);
        userGroup.setMembers(new ArrayList<>());

        // Create table mappings
        List<GroupTableMapping> tableMappings = new ArrayList<>();
        if (groupDTO.getTableIds() != null && !groupDTO.getTableIds().isEmpty()) {
            buildGroupTableMappings(groupDTO, configuration, tableMappings);
        }

        userGroup.setTableMappings(tableMappings);

        if (configuration.getGroups() == null) {
            configuration.setGroups(new ArrayList<>());
        }
        
        configuration.getGroups().add(userGroup);
        dataSourceConfigurationRepository.save(configuration);
    }

    private void buildGroupTableMappings(GroupUpsertDTO groupDTO, DataSourceConfiguration configuration, List<GroupTableMapping> tableMappings) {
        for (Integer tableId : groupDTO.getTableIds()) {
            TableDefinition tableDefinition = configuration.getTableDefinitions().stream()
                    .filter(table -> table.getId().equals(tableId))
                    .findFirst()
                    .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND, 
                        String.format("Table with ID %d not found", tableId)));

            GroupTableMapping mapping = new GroupTableMapping();
            mapping.setSchema(tableDefinition);
            tableMappings.add(mapping);
        }
    }

    @Override
    public void addUserToGroup(UserAccount user, Integer id, Integer groupId, AddUserToGroupDTO userDTO) {
        log.debug("Adding users to group with ID: {} in data source with ID: {}", groupId, id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);

        UserGroup userGroup = findGroupById(configuration, groupId);

        // Find all users to add
        List<UserAccount> usersToAdd = new ArrayList<>();
        for (Integer userId : userDTO.getUserIds()) {
            UserAccount userAccount = userAccountRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ResponseEnum.USER_NOT_FOUND, 
                        String.format("User with ID %d not found", userId)));
            usersToAdd.add(userAccount);
        }

        if (userGroup.getMembers() == null) {
            userGroup.setMembers(new ArrayList<>());
        }
        
        userGroup.getMembers().addAll(usersToAdd);
        dataSourceConfigurationRepository.save(configuration);
    }

    private UserGroup findGroupById(DataSourceConfiguration configuration, Integer groupId) {
        if (configuration.getGroups() == null) {
            throw new AppException(ResponseEnum.NOT_FOUND.getCode(), 
                String.format("Group with ID %d not found", groupId));
        }
        
        return configuration.getGroups().stream()
                .filter(group -> group.getId().equals(groupId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.NOT_FOUND.getCode(), 
                    String.format("Group with ID %d not found", groupId)));
    }

    @Override
    public void updateGroup(UserAccount user, Integer id, Integer groupId, GroupUpsertDTO groupDTO) {
        log.debug("Updating group with ID: {} in data source with ID: {}", groupId, id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        UserGroup userGroup = findGroupById(configuration, groupId);

        userGroup.setName(groupDTO.getName());

        // Update table mappings
        List<GroupTableMapping> tableMappings = new ArrayList<>();
        if (groupDTO.getTableIds() != null) {
            buildGroupTableMappings(groupDTO, configuration, tableMappings);
        }

        // Replace existing mappings
        if (userGroup.getTableMappings() != null) {
            userGroup.getTableMappings().clear();
        } else {
            userGroup.setTableMappings(new ArrayList<>());
        }
        
        userGroup.getTableMappings().addAll(tableMappings);
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void removeGroupFromDataSource(UserAccount user, Integer id, Integer groupId) {
        log.debug("Removing group with ID: {} from data source with ID: {}", groupId, id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        UserGroup userGroup = findGroupById(configuration, groupId);

        configuration.getGroups().remove(userGroup);
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void removeUserFromGroup(UserAccount user, Integer id, Integer groupId, Integer userId) {
        log.debug("Removing user with ID: {} from group with ID: {} in data source with ID: {}", userId, groupId, id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        UserGroup userGroup = findGroupById(configuration, groupId);

        // Validate user exists
        userAccountRepository.findById(userId)
                .orElseThrow(() -> new AppException(ResponseEnum.USER_NOT_FOUND, 
                    String.format("User with ID %d not found", userId)));

        if (userGroup.getMembers() != null) {
            userGroup.getMembers().removeIf(member -> member.getId().equals(userId));
        }

        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void testConnection(UserAccount user, Integer id) {
        log.debug("Testing connection for data source with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        
        // Create connection request object
        Map<String, String> request = new HashMap<>();
        request.put("url", String.format("%s:%s/%s",
                configuration.getHost(),
                configuration.getPort(),
                configuration.getDatabaseName()));
        request.put("username", configuration.getUsername());
        request.put("password", configuration.getPassword());
        request.put("type", configuration.getDatabaseType().name().toLowerCase());

        try {
            // Proxy request to embed service and wait for response
            Mono<String> response = embedService.proxyRequest("/api/v1/db/test-connection", request);
            
            response.doOnError(error -> {
                log.error("Connection test failed: {}", error.getMessage());
                throw new AppException(ResponseEnum.DATASOURCE_CONNECT_FAILED, 
                    "Failed to connect to data source: " + error.getMessage());
            }).block();
            
            log.debug("Connection test successful for data source with ID: {}", id);
        } catch (Exception ex) {
            log.error("Connection test failed with exception: {}", ex.getMessage());
            throw new AppException(ResponseEnum.DATASOURCE_CONNECT_FAILED, 
                "Failed to connect to data source: " + ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void updateMultipleColumns(UserAccount user, Integer id, UpdateColumnsDTO updateColumnsDTO) {
        log.debug("Updating multiple columns in data source with ID: {}", id);
        
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        
        for (UpdateColumnsDTO.ColumnUpdate columnUpdate : updateColumnsDTO.getColumns()) {
            // Find the table
            TableDefinition table = configuration.getTableDefinitions().stream()
                    .filter(t -> t.getId().equals(columnUpdate.getTableId()))
                    .findFirst()
                    .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND, 
                        String.format("Table with ID %d not found", columnUpdate.getTableId())));
            
            // Find the column
            TableColumn column = table.getColumns().stream()
                    .filter(c -> c.getId().equals(columnUpdate.getColumnId()))
                    .findFirst()
                    .orElseThrow(() -> new AppException(ResponseEnum.COLUMN_NOT_FOUND, 
                        String.format("Column with ID %d not found", columnUpdate.getColumnId())));
            
            // Update column properties
            if (columnUpdate.getColumnIdentifier() != null) {
                column.setColumnIdentifier(columnUpdate.getColumnIdentifier());
            }
            if (columnUpdate.getColumnType() != null) {
                column.setColumnType(columnUpdate.getColumnType());
            }
            if (columnUpdate.getColumnDescription() != null) {
                column.setColumnDescription(columnUpdate.getColumnDescription());
            }
            if (columnUpdate.getIsPrimaryKey() != null) {
                column.setIsPrimaryKey(columnUpdate.getIsPrimaryKey());
            }
        }
        
        dataSourceConfigurationRepository.save(configuration);
    }
}