package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.dto.StatementDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StatementMapper {
    List<StatementDto.Response> selectMonthlyStatements(
            @Param("memberId") Long memberId,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );
}
