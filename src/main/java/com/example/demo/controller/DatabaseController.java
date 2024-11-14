package com.example.demo.controller;

import com.example.demo.request.DbConnectionRequest;
import com.example.demo.response.DefaultResponse;
import com.example.demo.service.SchemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/db")
@RequiredArgsConstructor
public class DatabaseController {
    private final SchemaService schemaService;

    @PostMapping("/connect")
    public ResponseEntity<DefaultResponse> connectToDatabase(@RequestBody DbConnectionRequest request) {
        return schemaService
                .getDatabaseSchema(request)
                .response();
    }
}

