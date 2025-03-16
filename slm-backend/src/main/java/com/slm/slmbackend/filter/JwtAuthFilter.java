package com.slm.slmbackend.filter;

import com.slm.slmbackend.config.Whitelist;
import com.slm.slmbackend.exception.AppException;
import com.slm.slmbackend.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final HandlerExceptionResolver handlerExceptionResolver;
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        return Whitelist.get().entrySet().stream()
                .anyMatch(entry -> {
                    String pattern = entry.getKey();
                    String allowedMethod = entry.getValue();

                    return PATH_MATCHER.match(pattern, path) &&
                            ("ANY".equalsIgnoreCase(allowedMethod) || allowedMethod.equalsIgnoreCase(method));
                });
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) {

        final String accessToken = resolveToken(request);
        if (accessToken == null) {
            resolveException(
                response,
                new AppException(401, "UNAUTHORIZED"));
            return;
        }

        try {
            final String username = jwtUtil.extractUsername(accessToken);
            Authentication authentication =
                    SecurityContextHolder.getContext().getAuthentication();

            if (username != null && authentication == null) {
                UserDetails user = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.isTokenValid(accessToken, user)) {
                    UsernamePasswordAuthenticationToken token =
                            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    token.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(token);
                }
            }

            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            resolveException(
                    response,
                    new AppException(401, "Token expired"));
        } catch (Exception exception) {
            handlerExceptionResolver.resolveException(
                    request,
                    response,
                    null,
                    exception);
        }
    }

    private String resolveToken(@NonNull HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }

    //resolveException
    private void resolveException(HttpServletResponse response, AppException e) {
        response.setStatus(e.getCode());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String body = "{\"statusCode\":" + e.getCode() + ",\"message\":\"" + e.getMessage() + "\"}";
            response.getWriter().write(body);
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }
}