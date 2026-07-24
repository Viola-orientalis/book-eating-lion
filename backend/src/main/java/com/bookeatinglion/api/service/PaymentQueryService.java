package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Order;
import com.bookeatinglion.api.domain.OrderStatus;
import com.bookeatinglion.api.dto.PaymentDto;
import com.bookeatinglion.api.mapper.OrderMapper;
import com.bookeatinglion.api.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentQueryService {

    private final PaymentMapper paymentMapper;
    private final OrderMapper orderMapper;
    private final KakaoPayService kakaoPayService;

    public PaymentDto.KakaoReadyResponse kakaoPayReady(Long memberId, PaymentDto.KakaoReadyRequest request) {
        Order order = orderMapper.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!order.getMemberId().equals(memberId)) {
            throw new IllegalArgumentException("본인의 주문만 결제할 수 있습니다.");
        }

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("결제 대기 중인 주문이 아닙니다.");
        }

        return kakaoPayService.ready(memberId, order.getOrderId(), order.getTotalAmount(), "도서 주문 #" + order.getOrderId());
    }

    public List<PaymentDto.HistoryResponse> getMyPayments(Long memberId) {
        return paymentMapper.findByMemberId(memberId).stream()
                .map(p -> new PaymentDto.HistoryResponse(
                        p.getPaymentId(),
                        p.getOrderId(),
                        p.getPaymentMethod(),
                        p.getAmount(),
                        p.getPaymentStatus(),
                        p.getApprovedAt(),
                        p.getOrderTitle()
                ))
                .toList();
    }
}
