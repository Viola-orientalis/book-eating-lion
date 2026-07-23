package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.domain.Book;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface BookMapper {
    List<Book> findAll(@Param("keyword") String keyword, 
                       @Param("category") String category, 
                       @Param("offset") int offset, 
                       @Param("limit") int limit);
                       
    long countAll(@Param("keyword") String keyword, 
                  @Param("category") String category);
                  
    Book findById(@Param("bookId") Long bookId);
    
    int decreaseStock(@Param("bookId") Long bookId, @Param("quantity") int quantity);
    
    int increaseStock(@Param("bookId") Long bookId, @Param("quantity") int quantity);

    int insertBook(Book book);

    int updateBook(Book book);

    int updateSaleStatus(@Param("bookId") Long bookId, @Param("saleStatus") String saleStatus);

    int deleteBook(@Param("bookId") Long bookId);
}
