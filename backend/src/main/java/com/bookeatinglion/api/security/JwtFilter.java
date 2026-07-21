package com.bookeatinglion.api.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    // 매 API 요청마다 토큰이 유효한지 검사하는 필터
    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (token.isBlank()) {
                filterChain.doFilter(request, response);
                return;
            }

            try {
                Claims claims = jwtUtil.parseAccessClaims(token);
                String type = String.valueOf(claims.get("type"));

                if (!"access".equals(type)) {
                    SecurityContextHolder.clearContext();
                } else {
                    String username = claims.getSubject();
                    UserDetails user = userDetailsService.loadUserByUsername(username);

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, null,
                            user.getAuthorities());

                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // 잘못되거나 만료된 토큰이 들어오더라도 필터에서 직접 401로 끊지 않고, Context를 비운 뒤 다음 필터로 넘겨
                // SecurityConfig의 permitAll() / authenticated() 규칙에 따라 처리되도록 함
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
