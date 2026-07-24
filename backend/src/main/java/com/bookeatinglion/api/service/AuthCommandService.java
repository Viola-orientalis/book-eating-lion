package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Member;
import com.bookeatinglion.api.domain.Role;
import com.bookeatinglion.api.dto.AuthDto;
import com.bookeatinglion.api.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthCommandService {

    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> signup(AuthDto.SignupRequest request) {
        if (memberMapper.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        Member newMember = new Member();
        newMember.setUsername(request.getUsername());
        newMember.setPassword(passwordEncoder.encode(request.getPassword()));
        newMember.setName(request.getName());
        newMember.setGender(request.getGender());
        newMember.setAge(request.getAge());
        newMember.setRole(Role.USER);

        memberMapper.insertMember(newMember);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "회원가입이 완료되었습니다.");
        response.put("memberId", newMember.getMemberId());
        return response;
    }

    public void deleteMe(String username) {
        Member member = memberMapper.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        memberMapper.softDeleteMember(member.getMemberId());
    }
}
