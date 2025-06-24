package com.slm.slmbackend.controller;

import com.slm.slmbackend.ratelimit.RateLimitingService;
import com.slm.slmbackend.response.ResponseWrapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/diagnostics")
@RequiredArgsConstructor
@Tag(name = "Diagnostics", description = "System diagnostics endpoints")
public class DiagnosticsController {
    
    private final RateLimitingService rateLimitingService;
    
    @Operation(summary = "Get rate limiting diagnostics", 
               description = "Returns current rate limiting configuration and status")
    @ApiResponse(responseCode = "200", description = "Rate limiting diagnostics retrieved successfully")
    @GetMapping("/rate-limit")
    public ResponseWrapper<RateLimitingService.RateLimitDiagnostics> getRateLimitDiagnostics() {
        return ResponseWrapper.success(rateLimitingService.getDiagnostics());
    }
    
    @Operation(summary = "Get active rate limit buckets", 
               description = "Returns all currently active rate limiting buckets for debugging")
    @ApiResponse(responseCode = "200", description = "Active buckets retrieved successfully")
    @GetMapping("/rate-limit/buckets")
    public ResponseWrapper<Map<String, RateLimitingService.RateLimitInfo>> getActiveBuckets() {
        return ResponseWrapper.success(rateLimitingService.getAllActiveBuckets());
    }
} 