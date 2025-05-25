package com.slm.slmbackend.dto.datasource;

import lombok.Data;

import java.util.List;
@Data
public class AddUserToGroupDTO {
    private List<String> usernames;
}
