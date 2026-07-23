package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.domain.Payment;
import com.bookeatinglion.api.domain.PaymentStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface PaymentMapper {
    void insertPayment(Payment payment);
    Optional<Payment> findById(Long paymentId);
    Optional<Payment> findByOrderId(Long orderId);
    List<Payment> findByMemberId(Long memberId);
    void updateStatus(@Param("paymentId") Long paymentId, @Param("status") PaymentStatus status, @Param("declineReason") String declineReason);
}
