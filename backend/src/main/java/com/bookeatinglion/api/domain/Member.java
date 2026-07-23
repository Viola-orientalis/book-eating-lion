package com.bookeatinglion.api.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
public class Member {
    private Long memberId;
    private String username;
    private String password;
    private String name;
    private Gender gender;
    private Integer age;
    private Role role;
    private boolean isDeleted;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
