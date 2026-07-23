package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.*;
import com.bookeatinglion.api.dto.PaymentDto;
import com.bookeatinglion.api.mapper.BookMapper;
import com.bookeatinglion.api.mapper.CardMapper;
import com.bookeatinglion.api.mapper.OrderMapper;
import com.bookeatinglion.api.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentMapper paymentMapper;
    private final OrderMapper orderMapper;
    private final CardMapper cardMapper;
    private final KakaoPayService kakaoPayService;
    private final BookMapper bookMapper;

    @Override
    @Transactional
    public PaymentDto.PayResponse payWithCard(Long memberId, PaymentDto.CardPayRequest request) {
        Order order = orderMapper.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!order.getMemberId().equals(memberId)) {
            throw new IllegalArgumentException("본인의 주문만 결제할 수 있습니다.");
        }

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("결제 대기 중인 주문이 아닙니다.");
        }

        Card card = cardMapper.findById(request.getCardId())
                .orElseThrow(() -> new IllegalArgumentException("카드를 찾을 수 없습니다."));

        if (!card.getMemberId().equals(memberId)) {
            throw new IllegalArgumentException("본인의 카드로만 결제할 수 있습니다.");
        }

        if (card.getCardStatus() != CardStatus.ACTIVE) {
            throw new IllegalArgumentException("사용 불가능한 카드입니다.");
        }

        // 원자적 카드 한도 및 상태 검증과 차감
        int affectedRows = cardMapper.updateUsageWithLimit(card.getCardId(), order.getTotalAmount());
        if (affectedRows == 0) {
            throw new IllegalArgumentException("카드 잔여 한도가 부족하거나 사용할 수 없는 카드입니다.");
        }
        orderMapper.updateStatus(order.getOrderId(), OrderStatus.PAID);

        String approvalNo = "APP" + System.currentTimeMillis();

        Payment payment = new Payment();
        payment.setOrderId(order.getOrderId());
        payment.setCardId(card.getCardId());
        payment.setPaymentMethod(PaymentMethod.CARD);
        payment.setApprovalNumber(approvalNo);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentStatus(PaymentStatus.APPROVED);
        payment.setIdempotencyKey(request.getIdempotencyKey());
        payment.setApprovedAt(LocalDateTime.now());

        paymentMapper.insertPayment(payment);

        return new PaymentDto.PayResponse(payment.getPaymentId(), approvalNo, PaymentStatus.APPROVED, order.getTotalAmount());
    }

    @Override
    @Transactional(readOnly = true)
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

    @Override
    @Transactional
    public PaymentDto.PayResponse kakaoPayApprove(Long memberId, PaymentDto.KakaoApproveRequest request) {
        Order order = orderMapper.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!order.getMemberId().equals(memberId)) {
            throw new IllegalArgumentException("본인의 주문만 결제할 수 있습니다.");
        }

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("결제 대기 중인 주문이 아닙니다.");
        }

        String approvalNo = kakaoPayService.approve(memberId, order.getOrderId(), request.getTid(), request.getPgToken());

        orderMapper.updateStatus(order.getOrderId(), OrderStatus.PAID);

        Payment payment = new Payment();
        payment.setOrderId(order.getOrderId());
        payment.setPaymentMethod(PaymentMethod.KAKAOPAY);
        payment.setPgTid(request.getTid());
        payment.setApprovalNumber(approvalNo);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentStatus(PaymentStatus.APPROVED);
        payment.setApprovedAt(LocalDateTime.now());

        paymentMapper.insertPayment(payment);

        return new PaymentDto.PayResponse(payment.getPaymentId(), approvalNo, PaymentStatus.APPROVED, order.getTotalAmount());
    }

    @Override
    @Transactional
    public void cancelPayment(Long memberId, Long paymentId, PaymentDto.CancelRequest request) {
        Payment payment = paymentMapper.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("결제 내역을 찾을 수 없습니다."));

        Order order = orderMapper.findById(payment.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!order.getMemberId().equals(memberId)) {
            throw new IllegalArgumentException("본인의 결제만 취소할 수 있습니다.");
        }

        if (payment.getPaymentStatus() == PaymentStatus.CANCELLED) {
            throw new IllegalArgumentException("이미 취소된 결제입니다.");
        }

        if (payment.getPaymentMethod() == PaymentMethod.KAKAOPAY) {
            kakaoPayService.cancel(payment.getPgTid(), payment.getAmount(), request.getCancelReason());
        } else if (payment.getPaymentMethod() == PaymentMethod.CARD && payment.getCardId() != null) {
            cardMapper.restoreUsage(payment.getCardId(), payment.getAmount());
        }

        // 재고 원상복구
        List<OrderItem> orderItems = orderMapper.findItemsByOrderId(order.getOrderId());
        for (OrderItem item : orderItems) {
            bookMapper.increaseStock(item.getBookId(), item.getQuantity());
        }

        orderMapper.updateStatus(order.getOrderId(), OrderStatus.CANCELLED);
        paymentMapper.updateStatus(payment.getPaymentId(), PaymentStatus.CANCELLED, request.getCancelReason());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentDto.HistoryResponse> getMyPayments(Long memberId) {
        return paymentMapper.findByMemberId(memberId).stream()
                .map(p -> new PaymentDto.HistoryResponse(
                        p.getPaymentId(),
                        p.getOrderId(),
                        p.getPaymentMethod(),
                        p.getAmount(),
                        p.getPaymentStatus(),
                        p.getApprovedAt()
                ))
                .toList();
    }
}
