package com.slm.slmbackend.service;

import com.slm.slmbackend.dto.datasource.AddUserToGroupDTO;
import com.slm.slmbackend.dto.datasource.GroupDTO;
import com.slm.slmbackend.dto.datasource.GroupUpsertDTO;
import com.slm.slmbackend.dto.auth.UserAccountDTO;
import com.slm.slmbackend.dto.datasource.*;
import com.slm.slmbackend.entity.UserAccount;
import jakarta.validation.Valid;

import java.util.List;

/**
 * Service interface for managing data source configurations
 */
public interface DataSourceConfigurationService {
    List<DataSourceConfigurationDTO> getAllDataSourceOwnedByUser(UserAccount user);
    List<DataSourceConfigurationViewDTO> getAllDataSourceAvailableForUser(UserAccount user);
    DataSourceConfigurationDetailDTO getDataSourceConfigurationById(UserAccount user, Integer id);

    List<UserAccountDTO> getAllOwnersOfDataSourceConfiguration(UserAccount user, Integer id);
    List<GroupDTO> getAllGroupsOfDataSourceConfiguration(UserAccount user, Integer id);
    GroupDetailDTO getGroupById(UserAccount user, Integer id);

    void createDataSourceConfiguration(UserAccount user, CreateDataSourceConfigurationDTO createDTO);
    void updateDataSourceConfiguration(UserAccount user, Integer id, UpdateDataSourceConfigurationDTO updateDTO);
    void deleteDataSourceConfiguration(UserAccount user, Integer id);

    void addTableToDataSource(UserAccount authenticatedUser, Integer id, @Valid CreateTableDTO tableDTO);
    void updateTable(UserAccount authenticatedUser, Integer id, Integer tableId, @Valid UpdateTableDTO tableDTO);
    void removeTableFromDataSource(UserAccount authenticatedUser, Integer id, Integer tableId);

    void addColumnToTable(UserAccount authenticatedUser, Integer id, Integer tableId, @Valid CreateColumnDTO columnDTO);
    void updateColumn(UserAccount authenticatedUser, Integer id, Integer tableId, Integer columnId, @Valid UpdateColumnDTO columnDTO);
    void removeColumnFromTable(UserAccount authenticatedUser, Integer id, Integer tableId, Integer columnId);

    void addRelationToColumn(UserAccount authenticatedUser, Integer id, Integer tableId, Integer columnId, @Valid CreateRelationDTO relationDTO);
    void updateRelation(UserAccount authenticatedUser, Integer id, Integer tableId, Integer columnId, Integer relationId, @Valid UpdateRelationDTO relationDTO);
    void removeRelationFromColumn(UserAccount authenticatedUser, Integer id, Integer tableId, Integer columnId, Integer relationId);

    void addGroupToDataSource(UserAccount authenticatedUser, Integer id, GroupUpsertDTO groupDTO);
    void addUserToGroup(UserAccount authenticatedUser, Integer id, Integer groupId, AddUserToGroupDTO userDTO);
    void updateGroup(UserAccount authenticatedUser, Integer id, Integer groupId, GroupUpsertDTO groupDTO);
    void removeGroupFromDataSource(UserAccount authenticatedUser, Integer id, Integer groupId);
    void removeUserFromGroup(UserAccount authenticatedUser, Integer id, Integer groupId, Integer userId);

    //chat
}