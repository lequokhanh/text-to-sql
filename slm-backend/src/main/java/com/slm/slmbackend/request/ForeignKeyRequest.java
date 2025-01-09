package com.slm.slmbackend.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForeignKeyRequest {
    public String references;
    public String column;
}
