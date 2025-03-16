package com.slm.slmembed.controller;

import com.slm.slmembed.request.DbConnectionRequest;
import com.slm.slmembed.request.DbConnectionWithQueryRequest;
import com.slm.slmembed.response.DefaultResponse;
import com.slm.slmembed.service.SchemaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/db")
@RequiredArgsConstructor
public class DatabaseController {
    private final SchemaService schemaService;

    @PostMapping(value = "/connect/sqlite", consumes = "multipart/form-data")
    public ResponseEntity<DefaultResponse> connectToDatabase(@RequestPart(value = "file") MultipartFile file) {
        return schemaService.getDatabaseSchemaSQLite(file).response();
    }

    @PostMapping(value = "/query/sqlite", consumes = "multipart/form-data")
    public ResponseEntity<DefaultResponse> queryDatabase(@RequestPart(value = "file") MultipartFile file,
                                                         @RequestPart(value = "query") String query) {
        return schemaService.executeQuerySQLite(file, query).response();
    }

    @PostMapping("/connect")
    public ResponseEntity<DefaultResponse> connectToDatabase(@Valid @RequestBody DbConnectionRequest request) {
        return schemaService.getDatabaseSchema(request).response();
    }

    @PostMapping("/query")
    public ResponseEntity<DefaultResponse> queryDatabase(@Valid @RequestBody DbConnectionWithQueryRequest request) {
        return schemaService.queryDatabase(request).response();
    }


}

