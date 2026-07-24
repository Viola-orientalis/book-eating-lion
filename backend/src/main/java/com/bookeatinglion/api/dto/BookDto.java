package com.bookeatinglion.api.dto;

import com.bookeatinglion.api.domain.Book;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class BookDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
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

        public static Response from(Book book) {
            if (book == null)
                return null;
            return Response.builder()
                    .bookId(book.getBookId())
                    .title(book.getTitle())
                    .author(book.getAuthor())
                    .publisher(book.getPublisher())
                    .isbn(book.getIsbn())
                    .price(book.getPrice())
                    .stock(book.getStock())
                    .category(book.getCategory())
                    .description(book.getDescription())
                    .imageUrl(book.getImageUrl())
                    .saleStatus(book.getSaleStatus())
                    .createdAt(book.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String title;
        private String author;
        private String publisher;
        private String isbn;
        private Long price;
        private Integer stock;
        private String category;
        private String description;
        private String saleStatus;

        public Book toEntity() {
            Book book = new Book();
            book.setTitle(this.title);
            book.setAuthor(this.author);
            book.setPublisher(this.publisher);
            book.setIsbn(this.isbn);
            book.setPrice(this.price);
            book.setStock(this.stock);
            book.setCategory(this.category);
            book.setDescription(this.description);
            book.setSaleStatus(this.saleStatus != null && !this.saleStatus.isEmpty() ? this.saleStatus : "ON_SALE");
            return book;
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String author;
        private String publisher;
        private String isbn;
        private Long price;
        private Integer stock;
        private String category;
        private String description;
        private String saleStatus;

        public Book toEntity(Long bookId) {
            Book book = new Book();
            book.setBookId(bookId);
            book.setTitle(this.title);
            book.setAuthor(this.author);
            book.setPublisher(this.publisher);
            book.setIsbn(this.isbn);
            book.setPrice(this.price);
            book.setStock(this.stock);
            book.setCategory(this.category);
            book.setDescription(this.description);
            book.setSaleStatus(this.saleStatus);
            return book;
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String saleStatus;
    }
}
