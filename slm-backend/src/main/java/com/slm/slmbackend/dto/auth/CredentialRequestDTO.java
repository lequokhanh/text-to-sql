package com.slm.slmbackend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CredentialRequestDTO {
    @NotBlank(message = "Host is required")
    private String username;

    @NotBlank(message = "Host is required")
    private String password;
}
