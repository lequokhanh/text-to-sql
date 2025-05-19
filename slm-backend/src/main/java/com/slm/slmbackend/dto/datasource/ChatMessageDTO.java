package com.slm.slmbackend.dto.datasource;

import com.slm.slmbackend.enums.UserRole;

import lombok.Data;

@Data
public class ChatMessageDTO {
    private Integer id;
    private UserRole userRole;
    private String message;
    private String responseData;
}
