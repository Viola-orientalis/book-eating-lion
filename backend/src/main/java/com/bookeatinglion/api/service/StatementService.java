package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.StatementDto;

import java.util.List;

public interface StatementService {
    List<StatementDto.Response> getStatements(Long memberId, String startDate, String endDate);
}
