package com.bookeatinglion.api.dto;

import com.bookeatinglion.api.domain.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        @NotNull(message = "도서 ID는 필수입니다.")
        private Long bookId;

        @NotNull(message = "수량은 필수입니다.")
        @Min(value = 1, message = "수량은 최소 1개 이상이어야 합니다.")
        private Integer quantity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotEmpty(message = "주문 상품 목록은 필수입니다.")
        @Valid
        private List<ItemRequest> orderItems;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class CreateResponse {
        private Long orderId;
        private Long totalAmount;
        private OrderStatus orderStatus;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class ItemResponse {
        private String title;
        private Integer quantity;
        private Long price;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class Response {
        private Long orderId;
        private Long totalAmount;
        private OrderStatus orderStatus;
        private LocalDateTime createdAt;
        private List<ItemResponse> orderItems;
    }
}
