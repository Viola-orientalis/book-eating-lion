package com.bookeatinglion.api.security;

import com.bookeatinglion.api.domain.Member;
import com.bookeatinglion.api.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

    private final MemberMapper memberMapper;

    // 인증/인가를 위해 DB에서 최신 유저 권한 정보를 불러옴
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Member m = memberMapper.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("not found"));

        return new CustomUserDetails(
                m.getMemberId(),
                m.getUsername(),
                m.getPassword(),
                m.getRole().name(),
                m.getName());
    }
}
