package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.OrderDto;
import com.bookeatinglion.api.dto.PageResponse;
import com.bookeatinglion.api.service.OrderQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderQueryService orderQueryService;

    @GetMapping
    public ResponseEntity<PageResponse<OrderDto.AdminResponse>> getAdminOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(orderQueryService.getAdminOrders(status, page, size));
    }
}
