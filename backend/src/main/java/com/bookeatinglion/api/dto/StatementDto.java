package com.bookeatinglion.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

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

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DownloadResponse {
        private String downloadUrl;
    }
}
