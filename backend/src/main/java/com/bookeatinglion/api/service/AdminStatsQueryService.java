package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.AdminStatsDto;
import com.bookeatinglion.api.mapper.AdminStatsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // CQRS: Replica DB 라우팅 적용
public class AdminStatsQueryService {

    private final AdminStatsMapper adminStatsMapper;

    public AdminStatsDto.SummaryResponse getSummaryStats() {
        BigDecimal totalSales = adminStatsMapper.getTotalSalesAmount();
        BigDecimal todaySales = adminStatsMapper.getTodaySalesAmount();
        long totalOrders = adminStatsMapper.getTotalOrderCount();
        long lowStock = adminStatsMapper.getLowStockCount();

        return AdminStatsDto.SummaryResponse.builder()
                .totalSalesAmount(totalSales)
                .todaySalesAmount(todaySales)
                .totalOrderCount(totalOrders)
                .lowStockCount(lowStock)
                .build();
    }

    public List<AdminStatsDto.DemographicPreferenceDto> getDemographicPreferences() {
        return adminStatsMapper.selectDemographicPreferences();
    }

    public List<AdminStatsDto.SalesTrendDto> getSalesTrend() {
        return adminStatsMapper.selectSalesTrend();
    }
}
