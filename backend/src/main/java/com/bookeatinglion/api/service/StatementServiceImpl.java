package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.StatementDto;
import com.bookeatinglion.api.mapper.StatementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatementServiceImpl implements StatementService {

    private final StatementMapper statementMapper;

    @Override
    public List<StatementDto.Response> getStatements(Long memberId, String startDate, String endDate) {
        return statementMapper.selectMonthlyStatements(memberId, startDate, endDate);
    }
}
