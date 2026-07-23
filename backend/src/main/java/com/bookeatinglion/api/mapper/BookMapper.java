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
}
