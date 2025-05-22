package com.slm.slmbackend.service.impl;

import org.springframework.stereotype.Service;

import com.slm.slmbackend.repository.UserAccountRepository;
import com.slm.slmbackend.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserAccountRepository userAccountRepository;

    @Override
    public boolean isUsernameExists(String username) {
        return userAccountRepository.existsByUsername(username);
    }
}