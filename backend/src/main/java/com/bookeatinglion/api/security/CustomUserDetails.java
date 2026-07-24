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
    private String username;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
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
