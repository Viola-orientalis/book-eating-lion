package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.AdminStatsDto;
import com.bookeatinglion.api.mapper.AdminStatsMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class AdminStatsServiceTest {

    @Mock
    private AdminStatsMapper adminStatsMapper;

    @InjectMocks
    private AdminStatsQueryService adminStatsService;

    @Test
    @DisplayName("대시보드 요약 통계 조회 테스트")
    void getSummaryStatsTest() {
        // given
        given(adminStatsMapper.getTotalSalesAmount()).willReturn(new BigDecimal("150000"));
        given(adminStatsMapper.getTodaySalesAmount()).willReturn(new BigDecimal("30000"));
        given(adminStatsMapper.getTotalOrderCount()).willReturn(5L);
        given(adminStatsMapper.getLowStockCount()).willReturn(2L);

        // when
        AdminStatsDto.SummaryResponse response = adminStatsService.getSummaryStats();

        // then
        assertThat(response.getTotalSalesAmount()).isEqualTo(new BigDecimal("150000"));
        assertThat(response.getTodaySalesAmount()).isEqualTo(new BigDecimal("30000"));
        assertThat(response.getTotalOrderCount()).isEqualTo(5L);
        assertThat(response.getLowStockCount()).isEqualTo(2L);
    }

    @Test
    @DisplayName("연령대 및 성별 선호 도서 통계 조회 테스트")
    void getDemographicPreferencesTest() {
        // given
        AdminStatsDto.DemographicPreferenceDto dto = AdminStatsDto.DemographicPreferenceDto.builder()
                .ageGroup("20대")
                .gender("MALE")
                .bookId(1L)
                .bookTitle("스프링 부트 마스터")
                .category("IT/프로그래밍")
                .totalQuantitySold(10L)
                .totalSalesAmount(new BigDecimal("250000"))
                .build();

        given(adminStatsMapper.selectDemographicPreferences()).willReturn(List.of(dto));

        // when
        List<AdminStatsDto.DemographicPreferenceDto> result = adminStatsService.getDemographicPreferences();

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAgeGroup()).isEqualTo("20대");
        assertThat(result.get(0).getGender()).isEqualTo("MALE");
        assertThat(result.get(0).getBookTitle()).isEqualTo("스프링 부트 마스터");
        assertThat(result.get(0).getTotalQuantitySold()).isEqualTo(10L);
    }
}
