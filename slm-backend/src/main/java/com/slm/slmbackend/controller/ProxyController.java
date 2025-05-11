package com.slm.slmbackend.controller;

import com.slm.slmbackend.service.EmbedService;
import com.slm.slmbackend.service.EngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/proxy")
public class ProxyController {
    private final EmbedService embedService;
    private final EngineService engineService;

    public ProxyController(EmbedService embedService, EngineService engineService) {
        this.embedService = embedService;
        this.engineService = engineService;
    }

    @PostMapping("/embed/{*path}")
    public Mono<ResponseEntity<String>> proxyToEmbed(@PathVariable String path, @RequestBody Object requestBody) {
        return embedService.proxyRequest(path, requestBody)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError().body(e.getMessage())));
    }

    @PostMapping("/engine/{*path}")
    public Mono<ResponseEntity<String>> proxyToEngine(@PathVariable String path, @RequestBody Object requestBody) {
        return engineService.proxyRequest(path, requestBody)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError().body(e.getMessage())));
    }
} 