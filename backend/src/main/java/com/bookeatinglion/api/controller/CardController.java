package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.CardDto;
import com.bookeatinglion.api.security.CustomUserDetails;
import com.bookeatinglion.api.service.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping
    public ResponseEntity<CardDto.Response> issueCard(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CardDto.IssueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cardService.issueCard(userDetails.getMemberId(), request));
    }

    @GetMapping
    public ResponseEntity<List<CardDto.Response>> getMyCards(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(cardService.getMyCards(userDetails.getMemberId()));
    }
}
