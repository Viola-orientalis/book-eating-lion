package com.bookeatinglion.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class StatementDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String statementId;
        private String periodStart;
        private String periodEnd;
        private Long totalAmount;
        private Integer paymentCount;
    }
}
