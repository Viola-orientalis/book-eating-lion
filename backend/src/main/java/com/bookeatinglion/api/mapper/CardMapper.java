package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.domain.Card;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CardMapper {
    void insertCard(Card card);
    List<Card> findByMemberId(Long memberId);
    Optional<Card> findById(Long cardId);
    void updateUsage(@Param("cardId") Long cardId, @Param("usage") Long usage);
    int updateUsageWithLimit(@Param("cardId") Long cardId, @Param("amount") Long amount);
    int restoreUsage(@Param("cardId") Long cardId, @Param("amount") Long amount);
}
