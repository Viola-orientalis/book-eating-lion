package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.OrderDto;
import com.bookeatinglion.api.security.CustomUserDetails;
import com.bookeatinglion.api.service.OrderCommandService;
import com.bookeatinglion.api.service.OrderQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderCommandService orderCommandService;
    private final OrderQueryService orderQueryService;

    @PostMapping
    public ResponseEntity<OrderDto.CreateResponse> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody OrderDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderCommandService.createOrder(userDetails.getMemberId(), request));
    }

    @GetMapping
    public ResponseEntity<List<OrderDto.Response>> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(orderQueryService.getMyOrders(userDetails.getMemberId()));
    }
}
