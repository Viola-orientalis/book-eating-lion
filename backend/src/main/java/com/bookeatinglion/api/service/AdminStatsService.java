package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.AdminStatsDto;

import java.util.List;

public interface AdminStatsService {
    AdminStatsDto.SummaryResponse getSummaryStats();
    List<AdminStatsDto.DemographicPreferenceDto> getDemographicPreferences();
    List<AdminStatsDto.SalesTrendDto> getSalesTrend();
}
