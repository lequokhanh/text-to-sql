package com.slm.slmbackend.controller;

import com.slm.slmbackend.dto.datasource.CreateDataSourceConfigurationDTO;
import com.slm.slmbackend.dto.datasource.DataSourceConfigurationDTO;
import com.slm.slmbackend.dto.datasource.DataSourceConfigurationViewDTO;
import com.slm.slmbackend.dto.datasource.UpdateDataSourceConfigurationDTO;
import com.slm.slmbackend.entity.UserAccount;
import com.slm.slmbackend.response.ResponseWrapper;
import com.slm.slmbackend.service.DataSourceConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing data source configurations
 */
@RestController
@RequestMapping("/api/v1/data-sources")
@RequiredArgsConstructor
public class DataSourceConfigurationController {

    private final DataSourceConfigurationService dataSourceConfigurationService;

    @PostMapping
    public ResponseWrapper<Void> createDataSource(
            @Valid @RequestBody CreateDataSourceConfigurationDTO createDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        UserAccount userAccount = (UserAccount) authentication.getPrincipal();

        dataSourceConfigurationService.createDataSourceConfiguration(userAccount, createDTO);
        return ResponseWrapper.success();
    }

    @GetMapping("/owned")
    public ResponseWrapper<List<DataSourceConfigurationDTO>> getOwnedDataSources() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        UserAccount userAccount = (UserAccount) authentication.getPrincipal();

        return ResponseWrapper.toResponse(dataSourceConfigurationService.getAllDataSourceOwnedByUser(userAccount));
    }

    @GetMapping("/available")
    public ResponseWrapper<List<DataSourceConfigurationViewDTO>> getAvailableDataSources() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        UserAccount userAccount = (UserAccount) authentication.getPrincipal();

        return ResponseWrapper.toResponse(dataSourceConfigurationService.getAllDataSourceAvailableForUser(userAccount));
    }

    @GetMapping("/{id}")
    public ResponseWrapper<DataSourceConfigurationDTO> getDataSourceById(@PathVariable Integer id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        UserAccount userAccount = (UserAccount) authentication.getPrincipal();

        return ResponseWrapper.toResponse(dataSourceConfigurationService.getDataSourceConfigurationById(userAccount, id));
    }

    @PutMapping("/{id}")
    public ResponseWrapper<DataSourceConfigurationDTO> updateDataSource(
            @PathVariable Integer id, @Valid @RequestBody UpdateDataSourceConfigurationDTO updateDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        UserAccount userAccount = (UserAccount) authentication.getPrincipal();

        return ResponseWrapper.toResponse(dataSourceConfigurationService.updateDataSourceConfiguration(userAccount, id, updateDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseWrapper<Void> deleteDataSource(@PathVariable Integer id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        UserAccount userAccount = (UserAccount) authentication.getPrincipal();

        dataSourceConfigurationService.deleteDataSourceConfiguration(userAccount, id);
        return ResponseWrapper.success();
    }

}