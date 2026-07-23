package com.bookeatinglion.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CartDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long cartItemId;
        private Long bookId;
        private String title;
        private Long price;
        private Integer quantity;
        private Long totalItemPrice;
        private String imageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddRequest {
        @NotNull(message = "도서 ID는 필수입니다.")
        private Long bookId;
        @NotNull(message = "수량은 필수입니다.")
        @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotNull(message = "수량은 필수입니다.")
        @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
        private Integer quantity;
    }
}
