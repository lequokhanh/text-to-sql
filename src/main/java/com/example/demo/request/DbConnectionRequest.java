package com.example.demo.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DbConnectionRequest {
    private String url;
    private String username;
    private String password;
    private String dbType;

    // Getters and setters
}
