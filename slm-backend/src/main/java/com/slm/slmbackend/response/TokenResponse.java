package com.slm.slmbackend.response;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

@Getter
@Setter
@Accessors(chain = true)
public class TokenResponse {
    private String token;
    private int expiresIn;
}
