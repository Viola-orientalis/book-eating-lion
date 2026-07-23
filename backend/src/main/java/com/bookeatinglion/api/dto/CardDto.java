package com.bookeatinglion.api.dto;

import com.bookeatinglion.api.domain.CardStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CardDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueRequest {
        @NotNull(message = "월 한도는 필수 입력 항목입니다.")
        @Min(value = 1000, message = "월 한도는 최소 1,000원 이상이어야 합니다.")
        private Long monthlyLimit;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class Response {
        private Long cardId;
        private String maskedCardNumber;
        private Long monthlyLimit;
        private Long currentUsage;
        private CardStatus cardStatus;
    }
}
