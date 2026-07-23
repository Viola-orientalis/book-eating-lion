package com.bookeatinglion.api.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.Getter;

@Getter
public class CustomUserDetails implements UserDetails {

    private Long memberId;
    private String username; // email 용도로 사용
    private String password;
    private Collection<? extends GrantedAuthority> authorities;

    // 추가 사용자 정보
    private String role;
    private String name;

    public CustomUserDetails(Long memberId, String username, String password, String role, String name) {
        this.memberId = memberId;
        this.username = username;
        this.password = password;
        this.role = role;
        this.name = name;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
