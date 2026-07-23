package com.bookeatinglion.api.dto;

import com.bookeatinglion.api.domain.Gender;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AuthDto {

    @Getter
    @Setter
    public static class LoginRequest {
        @NotBlank(message = "아이디는 필수입니다.")
        private String username;
        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
    }

    @Getter
    @Setter
    public static class SignupRequest {
        @NotBlank(message = "아이디는 필수입니다.")
        private String username;
        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
        @NotBlank(message = "이름은 필수입니다.")
        private String name;
        @NotNull(message = "성별은 필수입니다.")
        private Gender gender;
        @NotNull(message = "나이는 필수입니다.")
        @Min(value = 1, message = "나이는 1살 이상이어야 합니다.")
        private Integer age;
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
        private Gender gender;
        private Integer age;
        private String role;
        private LocalDateTime createdAt;
    }
}
