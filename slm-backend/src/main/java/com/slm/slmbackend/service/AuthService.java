package com.slm.slmbackend.service;

import com.slm.slmbackend.dto.auth.CredentialRequestDTO;
import com.slm.slmbackend.response.TokenResponse;

public interface AuthService {
    TokenResponse login(CredentialRequestDTO credentialRequestDTO);
    void register(CredentialRequestDTO credentialRequestDTO);
}
