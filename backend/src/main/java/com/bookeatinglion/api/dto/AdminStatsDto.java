package com.bookeatinglion.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public class AdminStatsDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryResponse {
        private BigDecimal totalSalesAmount;
        private BigDecimal todaySalesAmount;
        private long totalOrderCount;
        private long lowStockCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DemographicPreferenceDto {
        private String ageGroup; // 10대, 20대, 30대, 40대이상 등
        private String gender;   // MALE, FEMALE
        private Long bookId;
        private String bookTitle;
        private String category;
        private long totalQuantitySold;
        private BigDecimal totalSalesAmount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesTrendDto {
        private String datePeriod; // YYYY-MM-DD
        private long orderCount;
        private BigDecimal salesAmount;
    }
}
