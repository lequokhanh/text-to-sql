package com.slm.slmbackend.dto.datasource;

import lombok.Data;

import java.util.List;
@Data
public class GroupUpsertDTO {
    private String name;
    private List<Integer> tableIds;
}
