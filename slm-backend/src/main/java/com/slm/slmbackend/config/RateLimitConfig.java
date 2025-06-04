package com.slm.slmbackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.rate-limit")
@Data
public class RateLimitConfig {
    
    private long requestsPerMinute = 30L;
    
    private boolean enabled = true;
    
    private long bucketExpiryMinutes = 60L;
    
    private long cleanupIntervalMinutes = 10L;
    
    private String[] excludedPatterns = {
        "/health-check",
        "/actuator/**",
        "/favicon.ico"
    };
    
    private boolean includeHeaders = true;
    
    private boolean userBasedLimiting = true;
    
    public double getRefillRate() {
        return requestsPerMinute / 60.0;
    }
    
    public long getBucketCapacity() {
        return requestsPerMinute;
    }
}