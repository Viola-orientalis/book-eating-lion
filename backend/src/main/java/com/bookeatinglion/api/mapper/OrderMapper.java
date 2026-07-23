package com.bookeatinglion.api.mapper;

import com.bookeatinglion.api.domain.Order;
import com.bookeatinglion.api.domain.OrderItem;
import com.bookeatinglion.api.domain.OrderStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface OrderMapper {
    void insertOrder(Order order);
    void insertOrderItem(OrderItem orderItem);
    Optional<Order> findById(Long orderId);
    List<Order> findByMemberId(Long memberId);
    List<OrderItem> findItemsByOrderId(Long orderId);
    void updateStatus(@Param("orderId") Long orderId, @Param("status") OrderStatus status);
}
