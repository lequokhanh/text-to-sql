package com.slm.slmbackend.controller;

import com.slm.slmbackend.dto.auth.CredentialRequestDTO;
import com.slm.slmbackend.enums.ResponseEnum;
import com.slm.slmbackend.response.ResponseWrapper;
import com.slm.slmbackend.response.TokenResponse;
import com.slm.slmbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseWrapper<TokenResponse> login(
            @Valid @RequestBody CredentialRequestDTO credentialRequestDTO) {
        TokenResponse tokenResponse = authService.login(credentialRequestDTO);
        return ResponseWrapper.success(tokenResponse);
    }

    @PostMapping("/register")
    public ResponseWrapper<Void> register(
            @Valid @RequestBody CredentialRequestDTO credentialRequestDTO) {
        authService.register(credentialRequestDTO);
        return ResponseWrapper.success();
    }

}
