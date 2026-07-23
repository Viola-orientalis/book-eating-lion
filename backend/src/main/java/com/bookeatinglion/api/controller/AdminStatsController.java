package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.AdminStatsDto;
import com.bookeatinglion.api.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    /**
     * 대시보드 요약 통계 (총 매출액, 오늘 매출액, 총 주문수, 재고부족 상품 수)
     */
    @GetMapping("/summary")
    public ResponseEntity<AdminStatsDto.SummaryResponse> getSummaryStats() {
        return ResponseEntity.ok(adminStatsService.getSummaryStats());
    }

    /**
     * 연령대/성별(10대 남/여, 20대 남/여, 30대 남/여 등) 선호 도서 통계
     */
    @GetMapping("/demographic-preferences")
    public ResponseEntity<List<AdminStatsDto.DemographicPreferenceDto>> getDemographicPreferences() {
        return ResponseEntity.ok(adminStatsService.getDemographicPreferences());
    }

    /**
     * 최근 7일 매출 추이
     */
    @GetMapping("/sales-trend")
    public ResponseEntity<List<AdminStatsDto.SalesTrendDto>> getSalesTrend() {
        return ResponseEntity.ok(adminStatsService.getSalesTrend());
    }
}
