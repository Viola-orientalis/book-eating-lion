package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.AuthDto;
import com.bookeatinglion.api.service.AuthCommandService;
import com.bookeatinglion.api.service.AuthQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthCommandService authCommandService;
    private final AuthQueryService authQueryService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody AuthDto.SignupRequest request) {
        Map<String, Object> response = authCommandService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authQueryService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDto.MemberProfileResponse> getMe(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        AuthDto.MemberProfileResponse response = authQueryService.getMe(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteMe(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        authCommandService.deleteMe(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴 처리가 완료되었습니다."));
    }
}
