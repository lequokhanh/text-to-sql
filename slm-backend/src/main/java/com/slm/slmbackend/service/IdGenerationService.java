package com.slm.slmbackend.service;

public interface IdGenerationService {
    Long getNextId(String entityName);
}
