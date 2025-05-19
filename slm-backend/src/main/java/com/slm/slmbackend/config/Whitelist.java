package com.slm.slmbackend.config;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class Whitelist {
    private static final Map<String, String> WHITELIST = new HashMap<>();

    static {
        WHITELIST.put("/api/v1/auth/**", "ANY"); // "ANY" to allow all methods
        WHITELIST.put("/swagger-ui/**", "ANY");
        WHITELIST.put("/v3/api-docs/**", "ANY");
        WHITELIST.put("/health-check", "GET");
        WHITELIST.put("api/proxy/embed/**", "ANY");
    }

    public static Map<String, String> get() {
        return WHITELIST;
    }
}