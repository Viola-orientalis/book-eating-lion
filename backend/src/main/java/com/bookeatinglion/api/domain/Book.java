package com.bookeatinglion.api.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    private Long bookId;
    private String title;
    private String author;
    private String publisher;
    private String isbn;
    private Long price;
    private Integer stock;
    private String category;
    private String description;
    private String imageUrl;
    private String saleStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
