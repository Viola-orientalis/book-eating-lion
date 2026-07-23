package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.dto.AdminStatsDto;
import org.apache.ibatis.annotations.Mapper;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface AdminStatsMapper {

    BigDecimal getTotalSalesAmount();

    BigDecimal getTodaySalesAmount();

    long getTotalOrderCount();

    long getLowStockCount();

    List<AdminStatsDto.DemographicPreferenceDto> selectDemographicPreferences();

    List<AdminStatsDto.SalesTrendDto> selectSalesTrend();
}
