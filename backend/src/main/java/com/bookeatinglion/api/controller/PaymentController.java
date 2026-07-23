package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.PaymentDto;
import com.bookeatinglion.api.security.CustomUserDetails;
import com.bookeatinglion.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<PaymentDto.HistoryResponse>> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(paymentService.getMyPayments(userDetails.getMemberId()));
    }

    @PostMapping("/card")
    public ResponseEntity<PaymentDto.PayResponse> payWithCard(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentDto.CardPayRequest request) {
        return ResponseEntity.ok(paymentService.payWithCard(userDetails.getMemberId(), request));
    }

    @PostMapping("/kakaopay/ready")
    public ResponseEntity<PaymentDto.KakaoReadyResponse> kakaoPayReady(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentDto.KakaoReadyRequest request) {
        return ResponseEntity.ok(paymentService.kakaoPayReady(userDetails.getMemberId(), request));
    }

    @PostMapping("/kakaopay/approve")
    public ResponseEntity<PaymentDto.PayResponse> kakaoPayApprove(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentDto.KakaoApproveRequest request) {
        return ResponseEntity.ok(paymentService.kakaoPayApprove(userDetails.getMemberId(), request));
    }

    @PostMapping("/{paymentId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentDto.CancelRequest request) {
        paymentService.cancelPayment(userDetails.getMemberId(), paymentId, request);
        return ResponseEntity.ok(Map.of(
                "message", "결제가 성공적으로 취소되었습니다.",
                "paymentStatus", "CANCELLED"));
    }
}
