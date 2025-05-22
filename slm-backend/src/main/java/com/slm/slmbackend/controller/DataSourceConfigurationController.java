package com.slm.slmbackend.controller;

import com.slm.slmbackend.dto.auth.UserAccountDTO;
import com.slm.slmbackend.dto.datasource.*;
import com.slm.slmbackend.entity.UserAccount;
import com.slm.slmbackend.response.ResponseWrapper;
import com.slm.slmbackend.service.DataSourceConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/v1/data-sources")
@RequiredArgsConstructor
@Tag(name = "Data Source Configuration", description = "API for managing data source configurations")
public class DataSourceConfigurationController {

    private final DataSourceConfigurationService dataSourceConfigurationService;

    private UserAccount getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserAccount) authentication.getPrincipal();
    }

    @Operation(summary = "Create a new data source configuration", 
               description = "Creates a new data source configuration for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Data source created successfully")
    @PostMapping
    public ResponseWrapper<Void> createDataSource(
            @Valid @RequestBody CreateDataSourceConfigurationDTO createDTO) {
        dataSourceConfigurationService.createDataSourceConfiguration(getAuthenticatedUser(), createDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Get all data sources owned by user", 
               description = "Retrieves all data sources owned by the authenticated user")
    @ApiResponse(responseCode = "200", description = "List of owned data sources retrieved successfully")
    @GetMapping("/owned")
    public ResponseWrapper<List<DataSourceConfigurationDTO>> getOwnedDataSources() {
        return ResponseWrapper.success(dataSourceConfigurationService.getAllDataSourceOwnedByUser(getAuthenticatedUser()));
    }

    @Operation(summary = "Get all available data sources", 
               description = "Retrieves all data sources available for the authenticated user")
    @ApiResponse(responseCode = "200", description = "List of available data sources retrieved successfully")
    @GetMapping("/available")
    public ResponseWrapper<List<DataSourceConfigurationViewDTO>> getAvailableDataSources() {
        return ResponseWrapper.success(dataSourceConfigurationService.getAllDataSourceAvailableForUser(getAuthenticatedUser()));
    }

    @Operation(summary = "Get data source by ID", 
               description = "Retrieves a specific data source by its ID if available to the authenticated user")
    @ApiResponse(responseCode = "200", description = "Data source details retrieved successfully")
    @GetMapping("/{id}")
    public ResponseWrapper<DataSourceConfigurationDetailDTO> getDataSourceById(
            @Parameter(description = "ID of the data source") @PathVariable Integer id) {
        return ResponseWrapper.success(dataSourceConfigurationService.getDataSourceConfigurationById(getAuthenticatedUser(), id));
    }

    @Operation(summary = "Update data source", 
               description = "Updates an existing data source configuration")
    @ApiResponse(responseCode = "200", description = "Data source updated successfully")
    @PutMapping("/{id}")
    public ResponseWrapper<Void> updateDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Valid @RequestBody UpdateDataSourceConfigurationDTO updateDTO) {
        dataSourceConfigurationService.updateDataSourceConfiguration(getAuthenticatedUser(), id, updateDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Delete data source", 
               description = "Deletes an existing data source configuration")
    @ApiResponse(responseCode = "200", description = "Data source deleted successfully")
    @DeleteMapping("/{id}")
    public ResponseWrapper<Void> deleteDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id) {
        dataSourceConfigurationService.deleteDataSourceConfiguration(getAuthenticatedUser(), id);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Add table to data source", 
               description = "Adds a new table to an existing data source configuration")
    @ApiResponse(responseCode = "200", description = "Table added successfully")
    @PostMapping("/{id}/tables")
    public ResponseWrapper<Void> addTableToDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Valid @RequestBody CreateTableDTO tableDTO) {
        dataSourceConfigurationService.addTableToDataSource(getAuthenticatedUser(), id, tableDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Update table information", 
               description = "Updates an existing table in a data source configuration")
    @ApiResponse(responseCode = "200", description = "Table updated successfully")
    @PutMapping("/{id}/tables/{tableId}")
    public ResponseWrapper<Void> updateTable(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId, 
            @Valid @RequestBody UpdateTableDTO tableDTO) {
        dataSourceConfigurationService.updateTable(getAuthenticatedUser(), id, tableId, tableDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Remove table from data source", 
               description = "Removes a table from a data source configuration")
    @ApiResponse(responseCode = "200", description = "Table removed successfully")
    @DeleteMapping("/{id}/tables/{tableId}")
    public ResponseWrapper<Void> removeTableFromDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId) {
        dataSourceConfigurationService.removeTableFromDataSource(getAuthenticatedUser(), id, tableId);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Add column to table", 
               description = "Adds a new column to an existing table")
    @ApiResponse(responseCode = "200", description = "Column added successfully")
    @PostMapping("/{id}/tables/{tableId}/columns")
    public ResponseWrapper<Void> addColumnToTable(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId, 
            @Valid @RequestBody CreateColumnDTO columnDTO) {
        dataSourceConfigurationService.addColumnToTable(getAuthenticatedUser(), id, tableId, columnDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Update column information", 
               description = "Updates an existing column in a table")
    @ApiResponse(responseCode = "200", description = "Column updated successfully")
    @PutMapping("/{id}/tables/{tableId}/columns/{columnId}")
    public ResponseWrapper<Void> updateColumn(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId, 
            @Parameter(description = "ID of the column") @PathVariable Integer columnId, 
            @Valid @RequestBody UpdateColumnDTO columnDTO) {
        dataSourceConfigurationService.updateColumn(getAuthenticatedUser(), id, tableId, columnId, columnDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Remove column from table", 
               description = "Removes a column from a table")
    @ApiResponse(responseCode = "200", description = "Column removed successfully")
    @DeleteMapping("/{id}/tables/{tableId}/columns/{columnId}")
    public ResponseWrapper<Void> removeColumnFromTable(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId, 
            @Parameter(description = "ID of the column") @PathVariable Integer columnId) {
        dataSourceConfigurationService.removeColumnFromTable(getAuthenticatedUser(), id, tableId, columnId);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Add relation to column", 
               description = "Adds a new relation to an existing column")
    @ApiResponse(responseCode = "200", description = "Relation added successfully")
    @PostMapping("/{id}/tables/{tableId}/columns/{columnId}/relations")
    public ResponseWrapper<Void> addRelationToColumn(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId, 
            @Parameter(description = "ID of the column") @PathVariable Integer columnId, 
            @Valid @RequestBody CreateRelationDTO relationDTO) {
        dataSourceConfigurationService.addRelationToColumn(getAuthenticatedUser(), id, tableId, columnId, relationDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Update relation information", 
               description = "Updates an existing relation in a column")
    @ApiResponse(responseCode = "200", description = "Relation updated successfully")
    @PutMapping("/{id}/tables/{tableId}/columns/{columnId}/relations/{relationId}")
    public ResponseWrapper<Void> updateRelation(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId, 
            @Parameter(description = "ID of the column") @PathVariable Integer columnId, 
            @Parameter(description = "ID of the relation") @PathVariable Integer relationId, 
            @Valid @RequestBody UpdateRelationDTO relationDTO) {
        dataSourceConfigurationService.updateRelation(getAuthenticatedUser(), id, tableId, columnId, relationId, relationDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Remove relation from column", 
               description = "Removes a relation from a column")
    @ApiResponse(responseCode = "200", description = "Relation removed successfully")
    @DeleteMapping("/{id}/tables/{tableId}/columns/{columnId}/relations/{relationId}")
    public ResponseWrapper<Void> removeRelationFromColumn(
            @Parameter(description = "ID of the data source") @PathVariable Integer id, 
            @Parameter(description = "ID of the table") @PathVariable Integer tableId, 
            @Parameter(description = "ID of the column") @PathVariable Integer columnId, 
            @Parameter(description = "ID of the relation") @PathVariable Integer relationId) {
        dataSourceConfigurationService.removeRelationFromColumn(getAuthenticatedUser(), id, tableId, columnId, relationId);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Get all owners of a data source",
            description = "Retrieves all users who own a specific data source")
    @ApiResponse(responseCode = "200", description = "List of owners retrieved successfully")
    @GetMapping("/{id}/owners")
    public ResponseWrapper<List<UserAccountDTO>> getOwnersOfDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id) {
        return ResponseWrapper.success(dataSourceConfigurationService.getAllOwnersOfDataSourceConfiguration(getAuthenticatedUser(), id));
    }

    @Operation(summary = "Get all groups of a data source",
            description = "Retrieves all groups associated with a specific data source")
    @ApiResponse(responseCode = "200", description = "List of groups retrieved successfully")
    @GetMapping("/{id}/groups")
    public ResponseWrapper<List<GroupDTO>> getGroupsOfDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id) {
        return ResponseWrapper.success(dataSourceConfigurationService.getAllGroupsOfDataSourceConfiguration(getAuthenticatedUser(), id));
    }

    @Operation(summary = "Get group details",
            description = "Retrieves details of a specific group")
    @ApiResponse(responseCode = "200", description = "Group details retrieved successfully")
    @GetMapping("/groups/{groupId}")
    public ResponseWrapper<GroupDetailDTO> getGroupDetails(
            @Parameter(description = "ID of the group") @PathVariable Integer groupId) {
        return ResponseWrapper.success(dataSourceConfigurationService.getGroupById(getAuthenticatedUser(), groupId));
    }

    @Operation(summary = "Add group to data source",
            description = "Creates a new group for a data source")
    @ApiResponse(responseCode = "200", description = "Group added successfully")
    @PostMapping("/{id}/groups")
    public ResponseWrapper<Void> addGroupToDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id,
            @Valid @RequestBody GroupUpsertDTO groupDTO) {
        dataSourceConfigurationService.addGroupToDataSource(getAuthenticatedUser(), id, groupDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Add users to group",
            description = "Adds users to an existing group")
    @ApiResponse(responseCode = "200", description = "Users added to group successfully")
    @PostMapping("/{id}/groups/{groupId}/members")
    public ResponseWrapper<Void> addUsersToGroup(
            @Parameter(description = "ID of the data source") @PathVariable Integer id,
            @Parameter(description = "ID of the group") @PathVariable Integer groupId,
            @Valid @RequestBody AddUserToGroupDTO userDTO) {
        dataSourceConfigurationService.addUserToGroup(getAuthenticatedUser(), id, groupId, userDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Update group",
            description = "Updates an existing group in a data source")
    @ApiResponse(responseCode = "200", description = "Group updated successfully")
    @PutMapping("/{id}/groups/{groupId}")
    public ResponseWrapper<Void> updateGroup(
            @Parameter(description = "ID of the data source") @PathVariable Integer id,
            @Parameter(description = "ID of the group") @PathVariable Integer groupId,
            @Valid @RequestBody GroupUpsertDTO groupDTO) {
        dataSourceConfigurationService.updateGroup(getAuthenticatedUser(), id, groupId, groupDTO);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Remove group from data source",
            description = "Deletes a group from a data source")
    @ApiResponse(responseCode = "200", description = "Group removed successfully")
    @DeleteMapping("/{id}/groups/{groupId}")
    public ResponseWrapper<Void> removeGroupFromDataSource(
            @Parameter(description = "ID of the data source") @PathVariable Integer id,
            @Parameter(description = "ID of the group") @PathVariable Integer groupId) {
        dataSourceConfigurationService.removeGroupFromDataSource(getAuthenticatedUser(), id, groupId);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Remove user from group",
            description = "Removes a user from a group")
    @ApiResponse(responseCode = "200", description = "User removed from group successfully")
    @DeleteMapping("/{id}/groups/{groupId}/members/{userId}")
    public ResponseWrapper<Void> removeUserFromGroup(
            @Parameter(description = "ID of the data source") @PathVariable Integer id,
            @Parameter(description = "ID of the group") @PathVariable Integer groupId,
            @Parameter(description = "ID of the user") @PathVariable Integer userId) {
        dataSourceConfigurationService.removeUserFromGroup(getAuthenticatedUser(), id, groupId, userId);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Test connection",
            description = "Tests the connection to a data source")
    @ApiResponse(responseCode = "200", description = "Connection successful")
    @PostMapping("/{id}/test-connection")
    public ResponseWrapper<Void> testConnection(@Parameter(description = "ID of the data source") @PathVariable Integer id) {
        dataSourceConfigurationService.testConnection(getAuthenticatedUser(), id);
        return ResponseWrapper.success();
    }

    @Operation(summary = "Update multiple columns",
            description = "Updates multiple columns in a data source in a single request")
    @ApiResponse(responseCode = "200", description = "Columns updated successfully")
    @PutMapping("/{id}/columns/batch")
    public ResponseWrapper<Void> updateMultipleColumns(
            @Parameter(description = "ID of the data source") @PathVariable Integer id,
            @Valid @RequestBody UpdateColumnsDTO updateColumnsDTO) {
        dataSourceConfigurationService.updateMultipleColumns(getAuthenticatedUser(), id, updateColumnsDTO);
        return ResponseWrapper.success();
    }
    
}