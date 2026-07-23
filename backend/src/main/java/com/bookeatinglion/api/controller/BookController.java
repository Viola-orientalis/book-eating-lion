package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.domain.Book;
import com.bookeatinglion.api.dto.PageResponse;
import com.bookeatinglion.api.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<PageResponse<Book>> getBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        return ResponseEntity.ok(bookService.getBooks(keyword, category, page, size));
    }

    @GetMapping("/{bookId}")
    public ResponseEntity<Book> getBook(@PathVariable Long bookId) {
        return ResponseEntity.ok(bookService.getBookById(bookId));
    }
}
