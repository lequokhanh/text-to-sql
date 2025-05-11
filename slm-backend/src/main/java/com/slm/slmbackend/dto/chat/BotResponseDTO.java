package com.slm.slmbackend.dto.chat;

import lombok.Data;

@Data
public class BotResponseDTO {
    private String chatSessionId;
    private String sql;
    private String data;
}
