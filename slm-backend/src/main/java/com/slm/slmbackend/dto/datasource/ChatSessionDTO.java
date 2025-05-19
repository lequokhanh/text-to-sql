package com.slm.slmbackend.dto.datasource;

import lombok.Data;

@Data
public class ChatSessionDTO {
    private Integer id;
    private String conversationName;
    private Integer dataSourceId;
}
