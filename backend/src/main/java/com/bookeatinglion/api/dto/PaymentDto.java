package com.bookeatinglion.api.dto;

import com.bookeatinglion.api.domain.PaymentMethod;
import com.bookeatinglion.api.domain.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PaymentDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CardPayRequest {
        @NotNull(message = "주문 ID는 필수입니다.")
        private Long orderId;

        @NotNull(message = "카드 ID는 필수입니다.")
        private Long cardId;

        @NotBlank(message = "멱등성 키는 필수입니다.")
        private String idempotencyKey;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KakaoReadyRequest {
        @NotNull(message = "주문 ID는 필수입니다.")
        private Long orderId;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class KakaoReadyResponse {
        private String tid;
        private String nextRedirectPcUrl;
        private String nextRedirectMobileUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KakaoApproveRequest {
        @NotNull(message = "주문 ID는 필수입니다.")
        private Long orderId;

        @NotBlank(message = "결제 고유번호(tid)는 필수입니다.")
        private String tid;

        @NotBlank(message = "결제 승인 토큰(pgToken)은 필수입니다.")
        private String pgToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CancelRequest {
        @NotBlank(message = "취소 사유는 필수입니다.")
        private String cancelReason;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class PayResponse {
        private Long paymentId;
        private String approvalNumber;
        private PaymentStatus status;
        private Long amount;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class HistoryResponse {
        private Long paymentId;
        private Long orderId;
        private PaymentMethod paymentMethod;
        private Long amount;
        private PaymentStatus status;
        private LocalDateTime approvedAt;
    }
}
