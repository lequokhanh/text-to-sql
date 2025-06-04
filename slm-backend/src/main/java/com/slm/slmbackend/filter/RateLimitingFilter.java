package com.slm.slmbackend.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slm.slmbackend.config.RateLimitConfig;
import com.slm.slmbackend.config.Whitelist;
import com.slm.slmbackend.ratelimit.RateLimitingService;
import com.slm.slmbackend.response.ResponseWrapper;

import io.micrometer.common.lang.NonNull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {
    
    private final RateLimitingService rateLimitingService;
    private final RateLimitConfig rateLimitConfig;
    private final ObjectMapper objectMapper;
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (!rateLimitConfig.isEnabled()) {
            return true;
        }
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        boolean isAuthWhitelisted = Whitelist.get().entrySet().stream()
                .anyMatch(entry -> {
                    String pattern = entry.getKey();
                    String allowedMethod = entry.getValue();
                    
                    return PATH_MATCHER.match(pattern, path) &&
                            ("ANY".equalsIgnoreCase(allowedMethod) || allowedMethod.equalsIgnoreCase(method));
                });
        
        if (isAuthWhitelisted) {
            log.debug("Request {} {} excluded from rate limiting (auth whitelist)", method, path);
            return true;
        }
        
        for (String pattern : rateLimitConfig.getExcludedPatterns()) {
            if (PATH_MATCHER.match(pattern, path)) {
                log.debug("Request {} {} excluded from rate limiting (config exclusions)", method, path);
                return true;
            }
        }
        
        return false;
    }
    
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        String clientIdentifier = getClientIdentifier(request);
        
        if (!rateLimitingService.isRequestAllowed(clientIdentifier)) {
            handleRateLimitExceeded(request, response, clientIdentifier);
            return;
        }
        
        if (rateLimitConfig.isIncludeHeaders()) {
            addRateLimitHeaders(response, clientIdentifier);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getClientIdentifier(@NonNull HttpServletRequest request) {
        if (rateLimitConfig.isUserBasedLimiting()) {
            String userIdentifier = getUserIdentifierFromContext(request);
            if (userIdentifier != null) {
                return "user:" + userIdentifier;
            }
        }
        
        String clientIp = getClientIpAddress(request);
        return "ip:" + clientIp;
    }
    
    private String getUserIdentifierFromContext(@NonNull HttpServletRequest request) {
        try {
            org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getPrincipal())) {
                return authentication.getName();
            }
        } catch (Exception e) {
            log.debug("Could not get user from security context: {}", e.getMessage());
        }
        return null;
    }
    
    private String getClientIpAddress(@NonNull HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return Optional.ofNullable(request.getRemoteAddr()).orElse("unknown");
    }
    
    private void handleRateLimitExceeded(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, 
                                       @NonNull String clientIdentifier) throws IOException {
        
        log.warn("Rate limit exceeded for client: {} on {} {}", 
                clientIdentifier, request.getMethod(), request.getRequestURI());
        
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        if (rateLimitConfig.isIncludeHeaders()) {
            addRateLimitHeaders(response, clientIdentifier);
        }

        ResponseWrapper<Object> errorResponse = new ResponseWrapper<>()
                .setCode(HttpStatus.TOO_MANY_REQUESTS.value())
                .setMessage("Rate limit exceeded. Too many requests. Please try again later.");
        
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
    }
    
    private void addRateLimitHeaders(HttpServletResponse response, String clientIdentifier) {
        try {
            RateLimitingService.RateLimitInfo rateLimitInfo = rateLimitingService.getRateLimitInfo(clientIdentifier);
            
            response.setHeader("X-RateLimit-Limit", String.valueOf(rateLimitInfo.getCapacity()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(rateLimitInfo.getRemainingTokens()));
            response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() + 60000)); 
            
            if (rateLimitInfo.isNearLimit()) {
                response.setHeader("X-RateLimit-Warning", "Rate limit nearly exceeded");
            }
        } catch (Exception e) {
            log.error("Error adding rate limit headers: {}", e.getMessage());
        }
    }
}