package com.slm.slmbackend.ratelimit;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

public class TokenBucket {
    private final long capacity;
    private final double refillRate;
    private final AtomicLong tokens;
    private final AtomicReference<Instant> lastRefillTime;

    public TokenBucket(long capacity, double refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = new AtomicLong(capacity);
        this.lastRefillTime = new AtomicReference<>(Instant.now());
    }

    public boolean tryConsume(long tokensToConsume) {
        refill();
        
        while (true) {
            long currentTokens = tokens.get();
            if (currentTokens < tokensToConsume) {
                return false;
            }
            
            if (tokens.compareAndSet(currentTokens, currentTokens - tokensToConsume)) {
                return true;
            }
        }
    }

    private void refill() {
        Instant now = Instant.now();
        Instant lastRefill = lastRefillTime.get();
        
        if (now.isAfter(lastRefill)) {
            double secondsElapsed = (now.toEpochMilli() - lastRefill.toEpochMilli()) / 1000.0;
            long tokensToAdd = (long) (secondsElapsed * refillRate);
            
            if (tokensToAdd > 0 && lastRefillTime.compareAndSet(lastRefill, now)) {
                while (true) {
                    long currentTokens = tokens.get();
                    long newTokens = Math.min(capacity, currentTokens + tokensToAdd);
                    
                    if (tokens.compareAndSet(currentTokens, newTokens)) {
                        break;
                    }
                }
            }
        }
    }

    public long getAvailableTokens() {
        refill();
        return tokens.get();
    }

    public long getCapacity() {
        return capacity;
    }

    public double getRefillRate() {
        return refillRate;
    }
}