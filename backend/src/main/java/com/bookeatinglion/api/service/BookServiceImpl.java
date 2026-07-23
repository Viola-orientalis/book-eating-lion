package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Book;
import com.bookeatinglion.api.dto.PageResponse;
import com.bookeatinglion.api.mapper.BookMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookServiceImpl implements BookService {

    private final BookMapper bookMapper;

    @Override
    public PageResponse<Book> getBooks(String keyword, String category, int page, int size) {
        int offset = page * size;
        List<Book> books = bookMapper.findAll(keyword, category, offset, size);
        long totalElements = bookMapper.countAll(keyword, category);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        PageResponse.PageInfo pageInfo = new PageResponse.PageInfo(page, size, totalElements, totalPages);
        return new PageResponse<>(books, pageInfo);
    }

    @Override
    public Book getBookById(Long bookId) {
        Book book = bookMapper.findById(bookId);
        if (book == null) {
            throw new RuntimeException("해당 도서를 찾을 수 없습니다.");
        }
        return book;
    }
}
