package com.slm.slmembed.controller;

import com.slm.slmembed.request.DbConnectionRequest;
import com.slm.slmembed.response.DefaultResponse;
import com.slm.slmembed.service.SchemaService;
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

