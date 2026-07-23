package com.bookeatinglion.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

public class AuthDto {

    @Getter
    @Setter
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Getter
    @Setter
    public static class SignupRequest {
        private String username;
        private String password;
        private String name;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class AuthResponse {
        private String accessToken;
        private Long memberId;
        private String name;
        private String role;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class MemberProfileResponse {
        private Long memberId;
        private String username;
        private String name;
        private String role;
        private LocalDateTime createdAt;
    }
}
