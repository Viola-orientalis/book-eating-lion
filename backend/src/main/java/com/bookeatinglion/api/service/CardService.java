package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.CardDto;

import java.util.List;

public interface CardService {
    CardDto.Response issueCard(Long memberId, CardDto.IssueRequest request);
    List<CardDto.Response> getMyCards(Long memberId);
}
