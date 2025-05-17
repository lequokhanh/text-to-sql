package com.slm.slmbackend.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AskQuestionRequestDTO {
    private Integer chatSessionId;
    
    @NotBlank(message = "Question is required")
    private String question;
    
    @NotNull(message = "Data source ID is required")
    private Integer dataSourceId;
} 