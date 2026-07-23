package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.StatementDto;
import com.bookeatinglion.api.security.CustomUserDetails;
import com.bookeatinglion.api.service.StatementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statements")
@RequiredArgsConstructor
public class StatementController {

    private final StatementService statementService;

    @GetMapping
    public ResponseEntity<List<StatementDto.Response>> getStatements(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(statementService.getStatements(userDetails.getMemberId(), startDate, endDate));
    }
}
