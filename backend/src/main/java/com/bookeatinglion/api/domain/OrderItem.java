package com.bookeatinglion.api.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class OrderItem {
    private Long orderItemId;
    private Long orderId;
    private Long bookId;
    private Integer quantity;
    private Long unitPrice;
    
    // 조인용 도서 정보
    private String bookTitle;
}
