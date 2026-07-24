package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.CartItem;
import com.bookeatinglion.api.dto.CartDto;
import com.bookeatinglion.api.mapper.CartMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CartCommandService {

    private final CartMapper cartMapper;

    public Long addCartItem(Long memberId, CartDto.AddRequest request) {
        CartItem existing = cartMapper.findByMemberIdAndBookId(memberId, request.getBookId());
        if (existing != null) {
            cartMapper.updateQuantity(existing.getCartItemId(), existing.getQuantity() + request.getQuantity());
            return existing.getCartItemId();
        } else {
            CartItem newItem = CartItem.builder()
                    .memberId(memberId)
                    .bookId(request.getBookId())
                    .quantity(request.getQuantity())
                    .build();
            cartMapper.insertCartItem(newItem);
            return newItem.getCartItemId();
        }
    }

    public void updateQuantity(Long memberId, Long cartItemId, CartDto.UpdateRequest request) {
        CartItem item = cartMapper.findById(cartItemId);
        if (item == null || !item.getMemberId().equals(memberId)) {
            throw new RuntimeException("장바구니 항목을 찾을 수 없거나 권한이 없습니다.");
        }
        cartMapper.updateQuantity(cartItemId, request.getQuantity());
    }

    public void deleteCartItem(Long memberId, Long cartItemId) {
        CartItem item = cartMapper.findById(cartItemId);
        if (item == null || !item.getMemberId().equals(memberId)) {
            throw new RuntimeException("장바구니 항목을 찾을 수 없거나 권한이 없습니다.");
        }
        cartMapper.deleteCartItem(cartItemId, memberId);
    }
}
