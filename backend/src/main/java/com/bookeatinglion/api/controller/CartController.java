package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.CartDto;
import com.bookeatinglion.api.security.CustomUserDetails;
import com.bookeatinglion.api.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartDto.Response>> getMyCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(cartService.getMyCart(userDetails.getMemberId()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CartDto.AddRequest request) {
        Long cartItemId = cartService.addCartItem(userDetails.getMemberId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "cartItemId", cartItemId,
                "message", "장바구니에 담겼습니다."
        ));
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<Map<String, String>> updateQuantity(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long cartItemId,
            @Valid @RequestBody CartDto.UpdateRequest request) {
        cartService.updateQuantity(userDetails.getMemberId(), cartItemId, request);
        return ResponseEntity.ok(Map.of("message", "수량이 변경되었습니다."));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Map<String, String>> deleteCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long cartItemId) {
        cartService.deleteCartItem(userDetails.getMemberId(), cartItemId);
        return ResponseEntity.ok(Map.of("message", "장바구니에서 삭제되었습니다."));
    }
}
