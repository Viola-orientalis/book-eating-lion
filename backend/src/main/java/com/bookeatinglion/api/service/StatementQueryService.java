package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.StatementDto;
import com.bookeatinglion.api.mapper.StatementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatementQueryService {

    private final StatementMapper statementMapper;

    public List<StatementDto.Response> getStatements(Long memberId, String startDate, String endDate) {
        return statementMapper.selectMonthlyStatements(memberId, startDate, endDate);
    }
}
