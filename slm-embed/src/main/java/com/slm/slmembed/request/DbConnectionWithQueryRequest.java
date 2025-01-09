package com.slm.slmembed.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DbConnectionWithQueryRequest extends DbConnectionRequest{
    private String query;
}
