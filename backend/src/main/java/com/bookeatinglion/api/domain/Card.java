package com.bookeatinglion.api.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@ToString
public class Card {
    private Long cardId;
    private Long memberId;
    private String cardToken;
    private String maskedCardNumber;
    private CardStatus cardStatus;
    private Long monthlyLimit;
    private Long currentUsage;
    private LocalDate issuedDate;
    private LocalDate expiryDate;
    private boolean isDeleted;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
