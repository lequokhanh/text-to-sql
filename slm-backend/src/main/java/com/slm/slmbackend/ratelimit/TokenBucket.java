package com.slm.slmbackend.ratelimit;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

public class TokenBucket {
    private final long capacity;
    private final double refillRate;
    private final AtomicLong tokens;
    private volatile long lastRefillTime;
    private final ReentrantLock refillLock = new ReentrantLock();

    public TokenBucket(long capacity, double refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = new AtomicLong(capacity);
        this.lastRefillTime = System.nanoTime();
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
        long now = System.nanoTime();
        long lastRefill = lastRefillTime;
        
        // Only proceed if enough time has passed to generate at least one token
        long timeDiff = now - lastRefill;
        if (timeDiff > 0) {
            // Calculate tokens to add with nanosecond precision
            double secondsElapsed = timeDiff / 1_000_000_000.0;
            long tokensToAdd = (long) Math.floor(secondsElapsed * refillRate);
            
            if (tokensToAdd > 0) {
                // Use lock to prevent race conditions during refill
                if (refillLock.tryLock()) {
                    try {
                        // Double-check pattern - verify time hasn't been updated by another thread
                        if (lastRefillTime == lastRefill) {
                            // Calculate the actual time consumed for the tokens we're adding
                            double timeConsumedForTokens = tokensToAdd / refillRate;
                            long nanosConsumed = (long) (timeConsumedForTokens * 1_000_000_000L);
                            
                            // Update the last refill time to account for the tokens we're adding
                            lastRefillTime = lastRefill + nanosConsumed;
                            
                            // Add tokens atomically
                            while (true) {
                                long currentTokens = tokens.get();
                                long newTokens = Math.min(capacity, currentTokens + tokensToAdd);
                                
                                if (tokens.compareAndSet(currentTokens, newTokens)) {
                                    break;
                                }
                            }
                        }
                    } finally {
                        refillLock.unlock();
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