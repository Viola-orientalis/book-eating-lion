package com.bookeatinglion.api.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
public class Payment {
    private Long paymentId;
    private Long orderId;
    private Long cardId;
    private PaymentMethod paymentMethod;
    private String pgTid;
    private String approvalNumber;
    private Long amount;
    private PaymentStatus paymentStatus;
    private String declineReason;
    private String idempotencyKey;
    private LocalDateTime approvedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String orderTitle;
}
