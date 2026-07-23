package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.domain.Member;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

@Mapper
public interface MemberMapper {
    Optional<Member> findByUsername(@Param("username") String username);
    void insertMember(Member member);
    void softDeleteMember(@Param("memberId") Long memberId);
}
