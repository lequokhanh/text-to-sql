package com.slm.slmbackend.service;

import com.slm.slmbackend.dto.datasource.CreateDataSourceConfigurationDTO;
import com.slm.slmbackend.dto.datasource.DataSourceConfigurationDTO;
import com.slm.slmbackend.dto.datasource.DataSourceConfigurationViewDTO;
import com.slm.slmbackend.dto.datasource.UpdateDataSourceConfigurationDTO;
import com.slm.slmbackend.entity.UserAccount;

import java.util.List;

/**
 * Service interface for managing data source configurations
 */
public interface DataSourceConfigurationService {
    void createDataSourceConfiguration(UserAccount user, CreateDataSourceConfigurationDTO createDTO);
    List<DataSourceConfigurationDTO> getAllDataSourceOwnedByUser(UserAccount user);
    List<DataSourceConfigurationViewDTO> getAllDataSourceAvailableForUser(UserAccount user);
    DataSourceConfigurationDTO getDataSourceConfigurationById(UserAccount user, Integer id);
    DataSourceConfigurationDTO updateDataSourceConfiguration(UserAccount user, Integer id, UpdateDataSourceConfigurationDTO updateDTO);
    void deleteDataSourceConfiguration(UserAccount user, Integer id);
}