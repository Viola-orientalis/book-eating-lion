package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.domain.CartItem;
import com.bookeatinglion.api.dto.CartDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CartMapper {
    List<CartDto.Response> findAllByMemberId(@Param("memberId") Long memberId);
    CartItem findByMemberIdAndBookId(@Param("memberId") Long memberId, @Param("bookId") Long bookId);
    void insertCartItem(CartItem cartItem);
    void updateQuantity(@Param("cartItemId") Long cartItemId, @Param("quantity") Integer quantity);
    void deleteCartItem(@Param("cartItemId") Long cartItemId, @Param("memberId") Long memberId);
    CartItem findById(@Param("cartItemId") Long cartItemId);
}
