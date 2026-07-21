package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.AuthDto;
import com.bookeatinglion.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody AuthDto.SignupRequest request) {
        Map<String, Object> response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDto.MemberProfileResponse> getMe(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        AuthDto.MemberProfileResponse response = authService.getMe(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteMe(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        authService.deleteMe(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴 처리가 완료되었습니다."));
    }
}
