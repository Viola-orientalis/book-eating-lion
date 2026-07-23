package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.OrderDto;

import java.util.List;

public interface OrderService {
    OrderDto.CreateResponse createOrder(Long memberId, OrderDto.CreateRequest request);
    List<OrderDto.Response> getMyOrders(Long memberId);
}
