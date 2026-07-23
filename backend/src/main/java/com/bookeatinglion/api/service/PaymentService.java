package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.PaymentDto;

import java.util.List;

public interface PaymentService {
    PaymentDto.PayResponse payWithCard(Long memberId, PaymentDto.CardPayRequest request);
    PaymentDto.KakaoReadyResponse kakaoPayReady(Long memberId, PaymentDto.KakaoReadyRequest request);
    PaymentDto.PayResponse kakaoPayApprove(Long memberId, PaymentDto.KakaoApproveRequest request);
    void cancelPayment(Long memberId, Long paymentId, PaymentDto.CancelRequest request);
    List<PaymentDto.HistoryResponse> getMyPayments(Long memberId);
}
