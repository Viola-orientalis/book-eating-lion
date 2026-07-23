package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.*;
import java.util.Map;

public interface AuthService {
    Map<String, Object> signup(AuthDto.SignupRequest request);

    AuthDto.AuthResponse login(AuthDto.LoginRequest request);

    AuthDto.MemberProfileResponse getMe(String username);

    void deleteMe(String username);
}
