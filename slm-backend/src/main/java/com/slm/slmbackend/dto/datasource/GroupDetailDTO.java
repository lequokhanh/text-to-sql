package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.dto.auth.UserAccountDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class GroupDetailDTO extends GroupDTO{
    private Integer id;
    private String name;
    private List<Integer> tableIds;
    private List<UserAccountDTO> members;
    private DataSourceConfigurationDTO dataSourceConfiguration;
}
