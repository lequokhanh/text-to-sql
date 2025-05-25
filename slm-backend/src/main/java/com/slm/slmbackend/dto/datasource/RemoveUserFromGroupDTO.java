package com.slm.slmbackend.dto.datasource;

import java.util.List;

import lombok.Data;

@Data
public class RemoveUserFromGroupDTO {
    List<String> usernames;
}
