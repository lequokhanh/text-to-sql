package com.slm.slmbackend.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ColumnSchemaRequest {
    public String name;
    public String dtype;
    public String description;
    public List<String> constraints;
}