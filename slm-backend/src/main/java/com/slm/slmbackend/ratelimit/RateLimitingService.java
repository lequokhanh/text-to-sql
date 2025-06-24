package com.slm.slmbackend.ratelimit;

import com.slm.slmbackend.config.RateLimitConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class RateLimitingService {
    
    private final RateLimitConfig config;
    
    private final ConcurrentHashMap<String, TokenBucketWrapper> buckets = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "rate-limit-cleanup");
        t.setDaemon(true);
        return t;
    });
    
    public RateLimitingService(RateLimitConfig config) {
        this.config = config;
        
        // Schedule cleanup task
        cleanupExecutor.scheduleAtFixedRate(
            this::cleanupExpiredBuckets,
            config.getCleanupIntervalMinutes(),
            config.getCleanupIntervalMinutes(),
            TimeUnit.MINUTES
        );
        
        log.info("Rate limiting service initialized with {} requests per minute", config.getRequestsPerMinute());
    }
    
    @PreDestroy
    public void shutdown() {
        log.info("Shutting down rate limiting service...");
        cleanupExecutor.shutdown();
        try {
            if (!cleanupExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                cleanupExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
        buckets.clear();
        log.info("Rate limiting service shutdown completed");
    }
    
    public boolean isRequestAllowed(String identifier) {
        if (!config.isEnabled()) {
            return true;
        }
        
        TokenBucketWrapper wrapper = buckets.computeIfAbsent(identifier, k -> 
            new TokenBucketWrapper(new TokenBucket(config.getBucketCapacity(), config.getRefillRate()))
        );
        
        wrapper.updateLastAccess();
        boolean allowed = wrapper.getTokenBucket().tryConsume(1);
        
        if (!allowed) {
            log.warn("Rate limit exceeded for identifier: {}", identifier);
        }
        
        return allowed;
    }
    
    public RateLimitInfo getRateLimitInfo(String identifier) {
        TokenBucketWrapper wrapper = buckets.get(identifier);
        if (wrapper == null) {
            return new RateLimitInfo(config.getBucketCapacity(), config.getBucketCapacity(), config.getRefillRate());
        }
        
        TokenBucket bucket = wrapper.getTokenBucket();
        return new RateLimitInfo(
            bucket.getCapacity(),
            bucket.getAvailableTokens(),
            bucket.getRefillRate()
        );
    }
    
    /**
     * Get diagnostic information about the rate limiting service
     */
    public RateLimitDiagnostics getDiagnostics() {
        return new RateLimitDiagnostics(
            config.isEnabled(),
            config.getRequestsPerMinute(),
            config.getRefillRate(),
            buckets.size(),
            config.isUserBasedLimiting()
        );
    }
    
    /**
     * Get all active buckets (for debugging purposes)
     */
    public java.util.Map<String, RateLimitInfo> getAllActiveBuckets() {
        return buckets.entrySet().stream()
            .collect(java.util.stream.Collectors.toMap(
                java.util.Map.Entry::getKey,
                entry -> {
                    TokenBucket bucket = entry.getValue().getTokenBucket();
                    return new RateLimitInfo(
                        bucket.getCapacity(),
                        bucket.getAvailableTokens(),
                        bucket.getRefillRate()
                    );
                }
            ));
    }
    
    private void cleanupExpiredBuckets() {
        Instant cutoff = Instant.now().minusSeconds(config.getBucketExpiryMinutes() * 60);
        
        buckets.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().getLastAccess().isBefore(cutoff);
            if (expired) {
                log.debug("Removing expired token bucket for identifier: {}", entry.getKey());
            }
            return expired;
        });
        
        log.debug("Token bucket cleanup completed. Active buckets: {}", buckets.size());
    }
    
    private static class TokenBucketWrapper {
        private final TokenBucket tokenBucket;
        private volatile Instant lastAccess;
        
        public TokenBucketWrapper(TokenBucket tokenBucket) {
            this.tokenBucket = tokenBucket;
            this.lastAccess = Instant.now();
        }
        
        public TokenBucket getTokenBucket() {
            return tokenBucket;
        }
        
        public Instant getLastAccess() {
            return lastAccess;
        }
        
        public void updateLastAccess() {
            this.lastAccess = Instant.now();
        }
    }
    
    public static class RateLimitDiagnostics {
        private final boolean enabled;
        private final long requestsPerMinute;
        private final double refillRate;
        private final int activeBuckets;
        private final boolean userBasedLimiting;
        
        public RateLimitDiagnostics(boolean enabled, long requestsPerMinute, double refillRate, 
                                  int activeBuckets, boolean userBasedLimiting) {
            this.enabled = enabled;
            this.requestsPerMinute = requestsPerMinute;
            this.refillRate = refillRate;
            this.activeBuckets = activeBuckets;
            this.userBasedLimiting = userBasedLimiting;
        }
        
        public boolean isEnabled() { return enabled; }
        public long getRequestsPerMinute() { return requestsPerMinute; }
        public double getRefillRate() { return refillRate; }
        public int getActiveBuckets() { return activeBuckets; }
        public boolean isUserBasedLimiting() { return userBasedLimiting; }
    }
    
    public static class RateLimitInfo {
        private final long capacity;
        private final long availableTokens;
        private final double refillRate;
        
        public RateLimitInfo(long capacity, long availableTokens, double refillRate) {
            this.capacity = capacity;
            this.availableTokens = availableTokens;
            this.refillRate = refillRate;
        }
        
        public long getCapacity() { return capacity; }
        public long getAvailableTokens() { return availableTokens; }
        public double getRefillRate() { return refillRate; }
        public long getRemainingTokens() { return availableTokens; }
        public boolean isNearLimit() { return availableTokens < capacity * 0.2; }
    }
}