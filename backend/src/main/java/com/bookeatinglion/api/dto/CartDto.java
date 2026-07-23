package com.bookeatinglion.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
        private Long bookId;
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Integer quantity;
    }
}
