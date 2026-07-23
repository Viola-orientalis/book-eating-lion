package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.*;
import com.bookeatinglion.api.domain.Member;
import com.bookeatinglion.api.domain.Role;
import com.bookeatinglion.api.mapper.MemberMapper;
import com.bookeatinglion.api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public Map<String, Object> signup(AuthDto.SignupRequest request) {
        // 중복 체크
        if (memberMapper.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        Member newMember = new Member();
        newMember.setUsername(request.getUsername());
        newMember.setPassword(passwordEncoder.encode(request.getPassword()));
        newMember.setName(request.getName());
        newMember.setRole(Role.USER);

        memberMapper.insertMember(newMember);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "회원가입이 완료되었습니다.");
        response.put("memberId", newMember.getMemberId());
        return response;
    }

    @Override
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Member member = memberMapper.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtUtil.createToken(member.getUsername(), member.getRole().name());

        return new AuthDto.AuthResponse(accessToken, member.getMemberId(), member.getName(), member.getRole().name());
    }

    @Override
    public AuthDto.MemberProfileResponse getMe(String username) {
        Member member = memberMapper.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return new AuthDto.MemberProfileResponse(
                member.getMemberId(),
                member.getUsername(),
                member.getName(),
                member.getRole().name(),
                member.getCreatedAt());
    }

    @Override
    public void deleteMe(String username) {
        Member member = memberMapper.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        memberMapper.softDeleteMember(member.getMemberId());
    }
}
