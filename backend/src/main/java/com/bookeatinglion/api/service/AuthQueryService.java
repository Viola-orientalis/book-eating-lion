package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Member;
import com.bookeatinglion.api.dto.AuthDto;
import com.bookeatinglion.api.mapper.MemberMapper;
import com.bookeatinglion.api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthQueryService {

    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Member member = memberMapper.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtUtil.createToken(member.getUsername(), member.getRole().name());

        return new AuthDto.AuthResponse(accessToken, member.getMemberId(), member.getName(), member.getRole().name());
    }

    public AuthDto.MemberProfileResponse getMe(String username) {
        Member member = memberMapper.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return new AuthDto.MemberProfileResponse(
                member.getMemberId(),
                member.getUsername(),
                member.getName(),
                member.getGender(),
                member.getAge(),
                member.getRole().name(),
                member.getCreatedAt());
    }
}
