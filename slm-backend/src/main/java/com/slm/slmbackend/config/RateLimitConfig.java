package com.slm.slmbackend.config;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
@ConfigurationProperties(prefix = "app.rate-limit")
@Data
@Slf4j
public class RateLimitConfig {
    
    private long requestsPerMinute = 1000L;
    
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
    
    @PostConstruct
    public void validate() {
        if (requestsPerMinute <= 0) {
            log.warn("Invalid requestsPerMinute value: {}. Setting to default 1000", requestsPerMinute);
            requestsPerMinute = 1000L;
        }
        
        if (bucketExpiryMinutes <= 0) {
            log.warn("Invalid bucketExpiryMinutes value: {}. Setting to default 60", bucketExpiryMinutes);
            bucketExpiryMinutes = 60L;
        }
        
        if (cleanupIntervalMinutes <= 0) {
            log.warn("Invalid cleanupIntervalMinutes value: {}. Setting to default 10", cleanupIntervalMinutes);
            cleanupIntervalMinutes = 10L;
        }
        
        // Ensure cleanup interval is not longer than bucket expiry
        if (cleanupIntervalMinutes > bucketExpiryMinutes) {
            log.warn("Cleanup interval ({}) is longer than bucket expiry ({}). Adjusting cleanup interval to {}", 
                    cleanupIntervalMinutes, bucketExpiryMinutes, bucketExpiryMinutes / 2);
            cleanupIntervalMinutes = Math.max(1, bucketExpiryMinutes / 2);
        }
        
        log.info("Rate limiting configuration: enabled={}, requestsPerMinute={}, userBasedLimiting={}", 
                enabled, requestsPerMinute, userBasedLimiting);
    }
    
    public double getRefillRate() {
        return requestsPerMinute / 60.0;
    }
    
    public long getBucketCapacity() {
        return requestsPerMinute;
    }
}