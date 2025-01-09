package com.slm.slmbackend.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TableSchemaRequest {
    public String name;
    public List<String> primaryKeys;
    public List<ColumnSchemaRequest> columns;
    public List<ForeignKeyRequest> foreignKeys;
}

