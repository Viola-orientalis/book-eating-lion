package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.dto.BookDto;
import com.bookeatinglion.api.service.BookCommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/books")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookController {

    private final BookCommandService bookCommandService;
    private final com.bookeatinglion.api.service.BookQueryService bookQueryService;

    // 관리자 상품 목록 조회
    @GetMapping
    public ResponseEntity<com.bookeatinglion.api.dto.PageResponse<BookDto.Response>> getAdminBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(bookQueryService.getBooks(keyword, category, page, size));
    }

    // 관리자 상품 등록 (Streaming Upload 적용)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createBook(
            @RequestPart("bookData") BookDto.CreateRequest request,
            @RequestPart(value = "image", required = false) MultipartFile coverImage) {
        try {
            Map<String, Object> response = bookCommandService.createBook(request, coverImage);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("관리자 상품 등록 실패 (S3 Upload 오류)", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "S3 이미지 업로드 실패: " + e.getMessage()));
        }
    }

    // 관리자 상품 정보 수정
    @PutMapping(value = "/{bookId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateBook(
            @PathVariable("bookId") Long bookId,
            @RequestPart("bookData") BookDto.UpdateRequest request,
            @RequestPart(value = "image", required = false) MultipartFile coverImage) {
        try {
            Map<String, Object> response = bookCommandService.updateBook(bookId, request, coverImage);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("관리자 상품 수정 실패 (S3 Upload 오류)", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "S3 이미지 업로드 실패: " + e.getMessage()));
        }
    }

    // 상품 판매 상태 변경 (ON_SALE, STOPPED, OUT_OF_STOCK)
    @PatchMapping("/{bookId}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable("bookId") Long bookId,
            @RequestBody BookDto.StatusUpdateRequest request) {
        try {
            Map<String, Object> response = bookCommandService.updateStatus(bookId, request.getSaleStatus());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 상품 삭제
    @DeleteMapping("/{bookId}")
    public ResponseEntity<Map<String, Object>> deleteBook(@PathVariable("bookId") Long bookId) {
        try {
            Map<String, Object> response = bookCommandService.deleteBook(bookId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
