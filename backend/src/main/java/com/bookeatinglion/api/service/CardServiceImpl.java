package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Card;
import com.bookeatinglion.api.domain.CardStatus;
import com.bookeatinglion.api.dto.CardDto;
import com.bookeatinglion.api.mapper.CardMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final CardMapper cardMapper;

    @Override
    @Transactional
    public CardDto.Response issueCard(Long memberId, CardDto.IssueRequest request) {
        String token = UUID.randomUUID().toString();
        String maskedNumber = "1234-****-****-" + String.format("%04d", (int)(Math.random() * 10000));

        Card card = new Card();
        card.setMemberId(memberId);
        card.setCardToken(token);
        card.setMaskedCardNumber(maskedNumber);
        card.setCardStatus(CardStatus.ACTIVE);
        card.setMonthlyLimit(request.getMonthlyLimit() != null ? request.getMonthlyLimit() : 1000000L);
        card.setCurrentUsage(0L);
        card.setIssuedDate(LocalDate.now());
        card.setExpiryDate(LocalDate.now().plusYears(3));

        cardMapper.insertCard(card);

        return new CardDto.Response(
                card.getCardId(),
                card.getMaskedCardNumber(),
                card.getMonthlyLimit(),
                card.getCurrentUsage(),
                card.getCardStatus()
        );
    }

    @Override
    @Transactional(readOnly = true)
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
