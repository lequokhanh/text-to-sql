package com.slm.slmbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${embed-service.base-url}")
    private String embedServiceUrl;

    @Value("${engine-service.base-url}")
    private String engineServiceUrl;

    @Bean
    public WebClient embedServiceWebClient() {
        System.out.println("embedServiceUrl: " + embedServiceUrl);
        return WebClient.builder()
                .baseUrl(embedServiceUrl)
                .build();
    }

    @Bean
    public WebClient engineServiceWebClient() {
        System.out.println("engineServiceUrl: " + engineServiceUrl);
        return WebClient.builder()
                .baseUrl(engineServiceUrl)
                .build();
    }
} 