package com.slm.slmbackend.config;

import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${embed-service.base-url}")
    private String embedServiceUrl;

    @Value("${engine-service.base-url}")
    private String engineServiceUrl;

    private HttpClient createHttpClient() {
    return HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, Integer.MAX_VALUE) // Effectively disable connect timeout
            .responseTimeout(Duration.ZERO) // Disable response timeout
            .option(ChannelOption.SO_TIMEOUT, 0) // Disable socket read timeout
            .option(ChannelOption.TCP_NODELAY, true); // Optional: Improve performance
    }

    @Bean
    public WebClient embedServiceWebClient() {
        System.out.println("embedServiceUrl: " + embedServiceUrl);
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .baseUrl(embedServiceUrl)
                .build();
    }

    @Bean
    public WebClient engineServiceWebClient() {
        System.out.println("engineServiceUrl: " + engineServiceUrl);
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .baseUrl(engineServiceUrl)
                .build();
    }
} 