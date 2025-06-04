package com.slm.slmbackend.ratelimit;

import com.slm.slmbackend.config.RateLimitConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
    
    public RateLimitingService(RateLimitConfig config) {
        this.config = config;
        cleanupExecutor.scheduleAtFixedRate(
            this::cleanupExpiredBuckets,
            config.getCleanupIntervalMinutes(),
            config.getCleanupIntervalMinutes(),
            TimeUnit.MINUTES
        );
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