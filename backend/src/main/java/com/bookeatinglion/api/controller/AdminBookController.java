package com.bookeatinglion.api.controller;

import com.bookeatinglion.api.domain.Book;
import com.bookeatinglion.api.mapper.BookMapper;
import com.bookeatinglion.api.service.S3UploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/books")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookController {

    private final BookMapper bookMapper;
    private final S3UploadService s3UploadService;

    /**
     * 관리자 상품 등록 (Streaming Upload 적용)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createBook(
            @RequestPart("book") Book book,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile) {

        if (book.getPrice() < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "가격은 0원 이상이어야 합니다."));
        }
        if (book.getStock() < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "재고는 0개 이상이어야 합니다."));
        }
        if (imageFile == null || imageFile.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "상품 이미지는 필수입니다."));
        }

        try {
            String imageUrl = s3UploadService.uploadStream(imageFile, "books");
            book.setImageUrl(imageUrl);

            if (book.getSaleStatus() == null || book.getSaleStatus().isEmpty()) {
                book.setSaleStatus("ON_SALE");
            }

            bookMapper.insertBook(book);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "상품이 성공적으로 등록되었습니다.");
            response.put("book", book);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            log.error("관리자 상품 등록 실패 (S3 Upload 오류)", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "S3 이미지 업로드 실패: " + e.getMessage()));
        }
    }

    /**
     * 관리자 상품 정보 수정
     */
    @PutMapping(value = "/{bookId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateBook(
            @PathVariable("bookId") Long bookId,
            @RequestPart("book") Book book,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile) {

        if (book.getPrice() < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "가격은 0원 이상이어야 합니다."));
        }
        if (book.getStock() < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "재고는 0개 이상이어야 합니다."));
        }

        try {
            book.setBookId(bookId);
            if (imageFile != null && !imageFile.isEmpty()) {
                String imageUrl = s3UploadService.uploadStream(imageFile, "books");
                book.setImageUrl(imageUrl);
            }

            int updatedRows = bookMapper.updateBook(book);
            if (updatedRows == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "해당 도서를 찾을 수 없습니다."));
            }

            return ResponseEntity.ok(Map.of("message", "상품 정보가 수정되었습니다.", "bookId", bookId));
        } catch (IOException e) {
            log.error("관리자 상품 수정 실패 (S3 Upload 오류)", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "S3 이미지 업로드 실패: " + e.getMessage()));
        }
    }

    /**
     * 상품 판매 상태 변경 (ON_SALE, STOPPED, OUT_OF_STOCK)
     */
    @PatchMapping("/{bookId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable("bookId") Long bookId,
            @RequestBody Map<String, String> request) {
        String saleStatus = request.get("saleStatus");
        if (saleStatus == null || (!saleStatus.equals("ON_SALE") && !saleStatus.equals("STOPPED")
                && !saleStatus.equals("OUT_OF_STOCK"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "유효하지 않은 판매 상태입니다. (ON_SALE, STOPPED, OUT_OF_STOCK 중 하나여야 합니다)"));
        }

        int updatedRows = bookMapper.updateSaleStatus(bookId, saleStatus);
        if (updatedRows == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "해당 도서를 찾을 수 없습니다."));
        }

        return ResponseEntity.ok(Map.of("message", "판매 상태가 변경되었습니다.", "bookId", bookId, "saleStatus", saleStatus));
    }

    /**
     * 상품 삭제
     */
    @DeleteMapping("/{bookId}")
    public ResponseEntity<?> deleteBook(@PathVariable("bookId") Long bookId) {
        int deletedRows = bookMapper.deleteBook(bookId);
        if (deletedRows == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "해당 도서를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(Map.of("message", "상품이 삭제되었습니다.", "bookId", bookId));
    }
}
