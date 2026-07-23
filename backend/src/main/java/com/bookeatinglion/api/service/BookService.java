package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Book;
import com.bookeatinglion.api.dto.PageResponse;

public interface BookService {
    PageResponse<Book> getBooks(String keyword, String category, int page, int size);
    Book getBookById(Long bookId);
}
