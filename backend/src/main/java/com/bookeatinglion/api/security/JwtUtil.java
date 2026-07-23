package com.bookeatinglion.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
@Getter
public class JwtUtil {

    // Access 토큰 비밀키
    @Value("${jwt.secretKey}")
    private String secretKey;

    // Refresh 토큰 비밀키
    @Value("${jwt.secretKeyRt}")
    private String secretKeyRt;

    private SecretKey ACCESS_KEY;
    private SecretKey REFRESH_KEY;

    // 키 초기화 세팅
    @PostConstruct
    public void init() {
        byte[] accessKeyBytes = Base64.getDecoder().decode(secretKey);
        byte[] refreshKeyBytes = Base64.getDecoder().decode(secretKeyRt);
        ACCESS_KEY = Keys.hmacShaKeyFor(accessKeyBytes);
        REFRESH_KEY = Keys.hmacShaKeyFor(refreshKeyBytes);
    }

    // Access Token 발급 (수명 짧음)
    public String createToken(String email, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + 1000L * 60 * 15); // 15분
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("type", "access")
                .issuedAt(now)
                .expiration(exp)
                .signWith(ACCESS_KEY)
                .compact();
    }

    // Refresh Token 발급 (수명 긺)
    public String createRefreshToken(String email, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + 1000L * 60 * 60 * 24 * 14); // 14일
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(exp)
                .signWith(REFRESH_KEY)
                .compact();
    }

    // Access Token 검증 및 파싱
    public Claims parseAccessClaims(String token) {
        return Jwts.parser().verifyWith(ACCESS_KEY).build().parseSignedClaims(token).getPayload();
    }

    // Refresh Token 검증 및 파싱
    public Claims parseRefreshClaims(String token) {
        return Jwts.parser().verifyWith(REFRESH_KEY).build().parseSignedClaims(token).getPayload();
    }

    // 토큰에서 유저 아이디(subject) 추출
    public String extractUsername(String token) {
        return parseAccessClaims(token).getSubject();
    }

    // Access 토큰 만료 여부 확인
    public boolean isAccessExpired(String accessToken) {
        return parseAccessClaims(accessToken).getExpiration().before(new Date());
    }

    // Refresh 토큰 만료 여부 확인
    public boolean isRefreshExpired(String refreshToken) {
        return parseRefreshClaims(refreshToken).getExpiration().before(new Date());
    }
}
