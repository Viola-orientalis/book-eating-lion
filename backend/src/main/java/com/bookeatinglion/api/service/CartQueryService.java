package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.CartDto;
import com.bookeatinglion.api.mapper.CartMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartQueryService {

    private final CartMapper cartMapper;

    public List<CartDto.Response> getMyCart(Long memberId) {
        return cartMapper.findAllByMemberId(memberId);
    }
}
