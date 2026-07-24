package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Order;
import com.bookeatinglion.api.domain.OrderItem;
import com.bookeatinglion.api.dto.OrderDto;
import com.bookeatinglion.api.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderQueryService {

    private final OrderMapper orderMapper;

    public List<OrderDto.Response> getMyOrders(Long memberId) {
        List<Order> orders = orderMapper.findByMemberId(memberId);

        return orders.stream().map(order -> {
            List<OrderItem> items = orderMapper.findItemsByOrderId(order.getOrderId());
            List<OrderDto.ItemResponse> itemDtos = items.stream()
                    .map(i -> new OrderDto.ItemResponse(i.getBookTitle(), i.getQuantity(), i.getUnitPrice() * i.getQuantity()))
                    .toList();

            return new OrderDto.Response(
                    order.getOrderId(),
                    order.getTotalAmount(),
                    order.getOrderStatus(),
                    order.getCreatedAt(),
                    itemDtos
            );
        }).toList();
    }

    public com.bookeatinglion.api.dto.PageResponse<OrderDto.AdminResponse> getAdminOrders(String status, int page, int size) {
        int offset = page * size;
        List<OrderDto.AdminResponse> content = orderMapper.findAllAdminOrders(status, offset, size);
        long totalElements = orderMapper.countAllAdminOrders(status);
        int totalPages = (int) Math.ceil((double) totalElements / Math.max(1, size));

        com.bookeatinglion.api.dto.PageResponse.PageInfo pageInfo = new com.bookeatinglion.api.dto.PageResponse.PageInfo(page, size, totalElements, totalPages);
        return new com.bookeatinglion.api.dto.PageResponse<>(content, pageInfo);
    }
}
