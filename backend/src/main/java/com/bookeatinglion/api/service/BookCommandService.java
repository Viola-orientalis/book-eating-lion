package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Book;
import com.bookeatinglion.api.dto.BookDto;
import com.bookeatinglion.api.mapper.BookMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class BookCommandService {

    private final BookMapper bookMapper;
    private final S3UploadService s3UploadService;

    public Map<String, Object> createBook(BookDto.CreateRequest request, MultipartFile imageFile) throws IOException {
        Book book = request.toEntity();

        if (book.getPrice() != null && book.getPrice() < 0) {
            throw new IllegalArgumentException("가격은 0원 이상이어야 합니다.");
        }
        if (book.getStock() != null && book.getStock() < 0) {
            throw new IllegalArgumentException("재고는 0개 이상이어야 합니다.");
        }
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("상품 이미지는 필수입니다.");
        }

        String imageUrl = s3UploadService.uploadStream(imageFile, "books");
        book.setImageUrl(imageUrl);

        bookMapper.insertBook(book);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "상품이 성공적으로 등록되었습니다.");
        response.put("book", BookDto.Response.from(book));
        return response;
    }

    public Map<String, Object> updateBook(Long bookId, BookDto.UpdateRequest request, MultipartFile imageFile) throws IOException {
        Book book = request.toEntity(bookId);

        if (book.getPrice() != null && book.getPrice() < 0) {
            throw new IllegalArgumentException("가격은 0원 이상이어야 합니다.");
        }
        if (book.getStock() != null && book.getStock() < 0) {
            throw new IllegalArgumentException("재고는 0개 이상이어야 합니다.");
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = s3UploadService.uploadStream(imageFile, "books");
            book.setImageUrl(imageUrl);
        }

        int updatedRows = bookMapper.updateBook(book);
        if (updatedRows == 0) {
            throw new IllegalArgumentException("해당 도서를 찾을 수 없습니다.");
        }

        return Map.of("message", "상품 정보가 수정되었습니다.", "bookId", bookId);
    }

    public Map<String, Object> updateStatus(Long bookId, String saleStatus) {
        if (saleStatus == null || (!saleStatus.equals("ON_SALE") && !saleStatus.equals("STOPPED") && !saleStatus.equals("OUT_OF_STOCK"))) {
            throw new IllegalArgumentException("유효하지 않은 판매 상태입니다. (ON_SALE, STOPPED, OUT_OF_STOCK 중 하나여야 합니다)");
        }

        int updatedRows = bookMapper.updateSaleStatus(bookId, saleStatus);
        if (updatedRows == 0) {
            throw new IllegalArgumentException("해당 도서를 찾을 수 없습니다.");
        }

        return Map.of("message", "판매 상태가 변경되었습니다.", "bookId", bookId, "saleStatus", saleStatus);
    }

    public Map<String, Object> deleteBook(Long bookId) {
        int deletedRows = bookMapper.deleteBook(bookId);
        if (deletedRows == 0) {
            throw new IllegalArgumentException("해당 도서를 찾을 수 없습니다.");
        }
        return Map.of("message", "상품이 삭제되었습니다.", "bookId", bookId);
    }
}
