package com.slm.slmbackend.service.impl;

import com.slm.slmbackend.dto.auth.CredentialRequestDTO;
import com.slm.slmbackend.entity.UserAccount;
import com.slm.slmbackend.exception.AppException;
import com.slm.slmbackend.repository.UserAccountRepository;
import com.slm.slmbackend.response.TokenResponse;
import com.slm.slmbackend.service.AuthService;
import com.slm.slmbackend.util.JwtUtil;
import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserAccountRepository userAccountRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public TokenResponse login(CredentialRequestDTO credentialRequestDTO) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(credentialRequestDTO.getUsername(), credentialRequestDTO.getPassword()));
        UserAccount user = userAccountRepository.findByUsername(credentialRequestDTO.getUsername())
                .orElseThrow(() -> new AppException(404, "User not found"));
        return new TokenResponse()
                .setToken(jwtUtil.generateToken(user))
                .setExpiresIn(jwtUtil.getExpirationTime());
    }

    @Override
    public void register(CredentialRequestDTO credentialRequestDTO) {
        UserAccount userAccount = userAccountRepository.findByUsername(credentialRequestDTO.getUsername()).orElse(null);
        if (userAccount != null) {
            throw new AppException(400, "User already exists");
        }
        userAccount = new UserAccount()
                .setUsername(credentialRequestDTO.getUsername())
                .setPassword(passwordEncoder.encode(credentialRequestDTO.getPassword()));
        userAccountRepository.save(userAccount);
    }

}
