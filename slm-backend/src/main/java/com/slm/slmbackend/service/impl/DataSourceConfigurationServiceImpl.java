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
import com.slm.slmbackend.service.IdGenerationService;
import com.slm.slmbackend.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.*;

import static com.slm.slmbackend.enums.ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class DataSourceConfigurationServiceImpl implements DataSourceConfigurationService {

    private final DataSourceConfigurationRepository dataSourceConfigurationRepository;
    private final ColumnRelationRepository columnRelationRepository;
    private final IdGenerationService idGenerationService;
    private final UserAccountRepository userAccountRepository;
    private final EmbedService embedService;
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

    private DataSourceConfiguration validateAndGetDataSource(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = dataSourceConfigurationRepository.findById(id).orElseThrow(
                () -> new AppException(DATA_SOURCE_CONFIGURATION_NOT_FOUND));
        if (configuration.getOwners().stream().map(UserAccount::getUsername).noneMatch(user.getUsername()::equals)) {
            throw new AppException(ResponseEnum.DATA_SOURCE_NOT_BELONG_TO_USER);
        }
        return configuration;
    }

    @Override
    public DataSourceConfigurationDetailDTO getDataSourceConfigurationById(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        return MapperUtil.mapObject(configuration, DataSourceConfigurationDetailDTO.class);
    }

    @Override
    public List<UserAccountDTO> getAllOwnersOfDataSourceConfiguration(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);

        // Get all owners and map them to DTOs
        return MapperUtil.mapList(configuration.getOwners(), UserAccountDTO.class);
    }

    @Override
    public List<GroupDTO> getAllGroupsOfDataSourceConfiguration(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);

        // Map all groups to GroupDTOs
        if (configuration.getGroups() == null || configuration.getGroups().isEmpty()) {
            return new ArrayList<>();
        }

        return MapperUtil.mapList(configuration.getGroups(), GroupDTO.class);
    }

    @Override
    public GroupDetailDTO getGroupById(UserAccount user, Integer groupId) {
        // This is slightly different as we're searching by group ID, not data source ID

        // First, find all data sources available to the user
        List<DataSourceConfiguration> availableDataSources =
                dataSourceConfigurationRepository.findAllByOwnersContains(user);
        availableDataSources.addAll(
                dataSourceConfigurationRepository.findAllDataSourceAvailableForUser(user));

        // Look for the group in all available data sources
        for (DataSourceConfiguration dataSource : availableDataSources) {
            if (dataSource.getGroups() != null) {
                Optional<UserGroup> foundGroup = dataSource.getGroups().stream()
                        .filter(group -> group.getId().equals(groupId))
                        .findFirst();

                if (foundGroup.isPresent()) {
                    UserGroup group = foundGroup.get();

                    // Create and populate the GroupDetailDTO
                    GroupDetailDTO dto = new GroupDetailDTO();
                    dto.setId(group.getId());
                    dto.setName(group.getName());

                    // Map the table IDs
                    if (group.getTableMappings() != null) {
                        List<Integer> tableIds = group.getTableMappings().stream()
                                .map(mapping -> mapping.getSchema().getId())
                                .toList();
                        dto.setTableIds(tableIds);
                    }

                    // Map the members
                    if (group.getMembers() != null) {
                        dto.setMembers(MapperUtil.mapList(group.getMembers(), UserAccountDTO.class));
                    }

                    // Map the data source configuration
                    dto.setDataSourceConfiguration(MapperUtil.mapObject(dataSource, DataSourceConfigurationDTO.class));

                    return dto;
                }
            }
        }

        // If we get here, we didn't find the group
        throw new AppException(ResponseEnum.NOT_FOUND.getCode(), "Group not found");
    }

    @Override
    public void updateDataSourceConfiguration(UserAccount user, Integer id, UpdateDataSourceConfigurationDTO updateDTO) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);

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
                throw new RuntimeException("Failed to update field: " + field.getName(), e);
            }
        }
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void deleteDataSourceConfiguration(UserAccount user, Integer id) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        configuration.getOwners().clear();
        dataSourceConfigurationRepository.save(configuration);

        dataSourceConfigurationRepository.delete(configuration);
    }

    @Override
    public void addTableToDataSource(UserAccount user, Integer id, CreateTableDTO tableDTO) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = MapperUtil.mapObject(tableDTO, TableDefinition.class);
        configuration.getTableDefinitions().add(tableDefinition);
        dataSourceConfigurationRepository.save(configuration);
    }



    @Override
    public void updateTable(UserAccount user, Integer id, Integer tableId, UpdateTableDTO tableDTO) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = configuration.getTableDefinitions().stream()
                .filter(table -> table.getId().equals(tableId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND));

        tableDefinition.setTableIdentifier(tableDTO.getTableIdentifier());
        tableDefinition.setId(tableDTO.getId());

        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void removeTableFromDataSource(UserAccount user, Integer id, Integer tableId) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = configuration.getTableDefinitions().stream()
                .filter(table -> table.getId().equals(tableId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND));

        configuration.getTableDefinitions().remove(tableDefinition);
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void addColumnToTable(UserAccount user, Integer id, Integer tableId, CreateColumnDTO columnDTO) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = configuration.getTableDefinitions().stream()
                .filter(table -> table.getId().equals(tableId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND));

        TableColumn column = MapperUtil.mapObject(columnDTO, TableColumn.class);
        tableDefinition.getColumns().add(column);
        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void updateColumn(UserAccount user, Integer id, Integer tableId, Integer columnId, UpdateColumnDTO columnDTO) {
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        result.column().setColumnIdentifier(columnDTO.getColumnIdentifier());
        result.column().setId(columnDTO.getId());

        dataSourceConfigurationRepository.save(result.configuration());
    }

    @Override
    public void removeColumnFromTable(UserAccount user, Integer id, Integer tableId, Integer columnId) {
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        result.tableDefinition().getColumns().remove(result.column());
        dataSourceConfigurationRepository.save(result.configuration());
    }

    private ColumnResult getColumnResult(UserAccount user, Integer id, Integer tableId, Integer columnId) {
        DataSourceConfiguration configuration = validateAndGetDataSource(user, id);
        TableDefinition tableDefinition = configuration.getTableDefinitions().stream()
                .filter(table -> table.getId().equals(tableId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND));

        TableColumn column = tableDefinition.getColumns().stream()
                .filter(col -> col.getId().equals(columnId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.COLUMN_NOT_FOUND));
        return new ColumnResult(configuration, tableDefinition, column);
    }

    private record ColumnResult(DataSourceConfiguration configuration, TableDefinition tableDefinition, TableColumn column) {
    }

    @Override
    public void addRelationToColumn(UserAccount user, Integer id, Integer tableId, Integer columnId, CreateRelationDTO relationDTO) {
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        TableDefinition targetTableDefinition = result.configuration().getTableDefinitions().stream()
                .filter(table -> table.getTableIdentifier().equals(relationDTO.getTableIdentifier()))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND));

        TableColumn targetColumn = targetTableDefinition.getColumns().stream()
                .filter(col -> col.getColumnIdentifier().equals(relationDTO.getToColumn()))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.COLUMN_NOT_FOUND));

        ColumnRelation columnRelation = new ColumnRelation()
                .setDataSource(result.configuration())
                .setFromColumn(result.column())
                .setToColumn(targetColumn)
                .setType(relationDTO.getType());

        columnRelationRepository.save(columnRelation);
    }

    @Override
    public void updateRelation(UserAccount user, Integer id, Integer tableId, Integer columnId, Integer relationId, UpdateRelationDTO relationDTO) {
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        ColumnRelation columnRelation = columnRelationRepository.findById(relationId)
                .orElseThrow(() -> new AppException(ResponseEnum.RELATION_NOT_FOUND));

        if (!columnRelation.getFromColumn().equals(result.column())) {
            throw new AppException(ResponseEnum.RELATION_NOT_BELONG_TO_COLUMN);
        }

        columnRelation.setType(relationDTO.getType());

        columnRelationRepository.save(columnRelation);
    }

    @Override
    public void removeRelationFromColumn(UserAccount user, Integer id, Integer tableId, Integer columnId, Integer relationId) {
        ColumnResult result = getColumnResult(user, id, tableId, columnId);

        ColumnRelation columnRelation = columnRelationRepository.findById(relationId)
                .orElseThrow(() -> new AppException(ResponseEnum.RELATION_NOT_FOUND));

        if (!columnRelation.getFromColumn().equals(result.column())) {
            throw new AppException(ResponseEnum.RELATION_NOT_BELONG_TO_COLUMN);
        }

        columnRelationRepository.delete(columnRelation);
    }


    @Override
    public void addGroupToDataSource(UserAccount authenticatedUser, Integer id, GroupUpsertDTO groupDTO) {
        DataSourceConfiguration configuration = validateAndGetDataSource(authenticatedUser, id);

        UserGroup userGroup = new UserGroup();
        userGroup.setName(groupDTO.getName());
        userGroup.setDataSourceConfiguration(configuration);
        userGroup.setMembers(new ArrayList<>());

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
                    .orElseThrow(() -> new AppException(ResponseEnum.TABLE_NOT_FOUND));

            GroupTableMapping mapping = new GroupTableMapping();
            mapping.setSchema(tableDefinition);
            tableMappings.add(mapping);
        }
    }

    @Override
    public void addUserToGroup(UserAccount authenticatedUser, Integer id, Integer groupId, AddUserToGroupDTO userDTO) {
        DataSourceConfiguration configuration = validateAndGetDataSource(authenticatedUser, id);

        UserGroup userGroup = configuration.getGroups().stream()
                .filter(group -> group.getId().equals(groupId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.NOT_FOUND.getCode(), "Group not found"));

        List<UserAccount> usersToAdd = new ArrayList<>();
        for (Integer userId : userDTO.getUserIds()) {
            UserAccount user = userAccountRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ResponseEnum.USER_NOT_FOUND));
            usersToAdd.add(user);
        }

        if (userGroup.getMembers() == null) {
            userGroup.setMembers(new ArrayList<>());
        }
        userGroup.getMembers().addAll(usersToAdd);

        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void updateGroup(UserAccount authenticatedUser, Integer id, Integer groupId, GroupUpsertDTO groupDTO) {
        DataSourceConfiguration configuration = validateAndGetDataSource(authenticatedUser, id);

        UserGroup userGroup = configuration.getGroups().stream()
                .filter(group -> group.getId().equals(groupId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.NOT_FOUND.getCode(), "Group not found"));

        userGroup.setName(groupDTO.getName());

        // Update table mappings
        List<GroupTableMapping> tableMappings = new ArrayList<>();
        if (groupDTO.getTableIds() != null) {
            buildGroupTableMappings(groupDTO, configuration, tableMappings);
        }

        // Clear existing mappings and add new ones
        if (userGroup.getTableMappings() != null) {
            userGroup.getTableMappings().clear();
        }
        userGroup.setTableMappings(tableMappings);

        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void removeGroupFromDataSource(UserAccount authenticatedUser, Integer id, Integer groupId) {
        DataSourceConfiguration configuration = validateAndGetDataSource(authenticatedUser, id);

        UserGroup userGroup = configuration.getGroups().stream()
                .filter(group -> group.getId().equals(groupId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.NOT_FOUND.getCode(), "Group not found"));

        configuration.getGroups().remove(userGroup);

        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void removeUserFromGroup(UserAccount authenticatedUser, Integer id, Integer groupId, Integer userId) {
        DataSourceConfiguration configuration = validateAndGetDataSource(authenticatedUser, id);

        UserGroup userGroup = configuration.getGroups().stream()
                .filter(group -> group.getId().equals(groupId))
                .findFirst()
                .orElseThrow(() -> new AppException(ResponseEnum.NOT_FOUND.getCode(), "Group not found"));

        UserAccount userToRemove = userAccountRepository.findById(userId)
                .orElseThrow(() -> new AppException(ResponseEnum.USER_NOT_FOUND));

        if (userGroup.getMembers() != null) {
            userGroup.getMembers().removeIf(member -> member.getId().equals(userId));
        }

        dataSourceConfigurationRepository.save(configuration);
    }

    @Override
    public void testConnection(UserAccount authenticatedUser, Integer id) {
        DataSourceConfiguration configuration = validateAndGetDataSource(authenticatedUser, id);
        
        // Create connection request object
        Map<String, String> request = new HashMap<>();
        request.put("url", String.format("%s:%s/%s",
                configuration.getHost(),
                configuration.getPort(),
                configuration.getDatabaseName()));
        request.put("username", configuration.getUsername());
        request.put("password", configuration.getPassword());
        request.put("type", configuration.getDatabaseType().name().toLowerCase());

        // Proxy request to embed service
        embedService.proxyRequest("/api/v1/db/test-connection", request)
                .doOnError(error -> {
                    throw new AppException(ResponseEnum.DATASOURCE_CONNECT_FAILED);
                })
                .block();
    }


}