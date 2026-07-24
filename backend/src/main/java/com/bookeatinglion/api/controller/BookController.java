package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.BookDto;
import com.bookeatinglion.api.dto.PageResponse;
import com.bookeatinglion.api.service.BookQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Validated
public class BookController {

    private final BookQueryService bookQueryService;

    @GetMapping
    public ResponseEntity<PageResponse<BookDto.Response>> getBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "페이지는 0 이상이어야 합니다.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "사이즈는 1 이상이어야 합니다.") int size) {

        return ResponseEntity.ok(bookQueryService.getBooks(keyword, category, page, size));
    }

    @GetMapping("/{bookId}")
    public ResponseEntity<BookDto.Response> getBook(@PathVariable Long bookId) {
        return ResponseEntity.ok(bookQueryService.getBookById(bookId));
    }
}
