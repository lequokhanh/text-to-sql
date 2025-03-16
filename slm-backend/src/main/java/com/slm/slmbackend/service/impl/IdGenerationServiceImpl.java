package com.slm.slmbackend.service.impl;

import com.slm.slmbackend.entity.IdCounter;
import com.slm.slmbackend.repository.IdCounterRepository;
import com.slm.slmbackend.service.IdGenerationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class IdGenerationServiceImpl implements IdGenerationService {
    private final IdCounterRepository idCounterRepository;
    private final ApplicationContext applicationContext;

    private static final int DEFAULT_CACHE_SIZE = 500000;
    private final ConcurrentMap<String, EntityCache> cacheMap = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    protected void init() {
        initializeCache("DataSourceConfiguration");
    }

    @Transactional
    protected void initializeCache(String entityName) {
        cacheMap.computeIfAbsent(entityName, key -> {
            long startId = idCounterRepository.getCurrentId(entityName)
                    .orElseGet(() -> {
                        IdCounter newCounter = new IdCounter()
                                .setEntityName(entityName)
                                .setCurrentId(100000L);
                        idCounterRepository.save(newCounter);
                        return 100000L;
                    });
            idCounterRepository.incrementId(entityName, (long) DEFAULT_CACHE_SIZE);
            return new EntityCache(startId, DEFAULT_CACHE_SIZE);
        });
    }

    @Transactional
    protected void fetchEntityIdFromDB(String entityName) {
        EntityCache cache = cacheMap.get(entityName);
        if (cache != null) {
            long newStartId = idCounterRepository.getCurrentId(entityName).orElseThrow();
            idCounterRepository.incrementId(entityName, (long) cache.getCacheSize());
            cache.updateStartId(newStartId);
        }
    }

    @Transactional
    public synchronized Long getNextId(String entityName) {
        initializeCache(entityName);
        EntityCache cache = cacheMap.get(entityName);
        if (cache.getCacheIndex() >= cache.getCacheSize()) {
            applicationContext.getBean(IdGenerationServiceImpl.class).fetchEntityIdFromDB(entityName);
        }
        return cache.getNextId();
    }

    private static class EntityCache {
        private long startId;
        private int cacheIndex;
        private final int cacheSize;

        public EntityCache(long startId, int cacheSize) {
            this.startId = startId;
            this.cacheSize = cacheSize;
            this.cacheIndex = 0;
        }

        public synchronized long getNextId() {
            return startId + cacheIndex++;
        }

        public synchronized int getCacheIndex() {
            return cacheIndex;
        }

        public synchronized int getCacheSize() {
            return cacheSize;
        }

        public synchronized void updateStartId(long newStartId) {
            this.startId = newStartId;
            this.cacheIndex = 0;
        }
    }
}