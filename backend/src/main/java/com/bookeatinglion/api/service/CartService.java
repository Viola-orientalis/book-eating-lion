package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.CartDto;
import java.util.List;

public interface CartService {
    List<CartDto.Response> getMyCart(Long memberId);
    Long addCartItem(Long memberId, CartDto.AddRequest request);
    void updateQuantity(Long memberId, Long cartItemId, CartDto.UpdateRequest request);
    void deleteCartItem(Long memberId, Long cartItemId);
}
