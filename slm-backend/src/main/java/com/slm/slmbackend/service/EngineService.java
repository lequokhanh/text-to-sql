package com.slm.slmbackend.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class EngineService {
    private final WebClient webClient;

    public EngineService(@Qualifier("engineServiceWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<String> proxyRequest(String path, Object requestBody) {
        return webClient.post()
                .uri(path)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class);
    }
} 