package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.CardDto;
import com.bookeatinglion.api.mapper.CardMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CardQueryService {

    private final CardMapper cardMapper;

    public List<CardDto.Response> getMyCards(Long memberId) {
        return cardMapper.findByMemberId(memberId).stream()
                .map(c -> new CardDto.Response(
                        c.getCardId(),
                        c.getMaskedCardNumber(),
                        c.getMonthlyLimit(),
                        c.getCurrentUsage(),
                        c.getCardStatus()
                ))
                .toList();
    }
}
