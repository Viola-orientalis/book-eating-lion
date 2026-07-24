package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.Book;
import com.bookeatinglion.api.domain.Order;
import com.bookeatinglion.api.domain.OrderItem;
import com.bookeatinglion.api.domain.OrderStatus;
import com.bookeatinglion.api.dto.OrderDto;
import com.bookeatinglion.api.mapper.BookMapper;
import com.bookeatinglion.api.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderCommandService {

    private final OrderMapper orderMapper;
    private final BookMapper bookMapper;

    public OrderDto.CreateResponse createOrder(Long memberId, OrderDto.CreateRequest request) {
        if (request.getOrderItems() == null || request.getOrderItems().isEmpty()) {
            throw new IllegalArgumentException("주문할 상품이 없습니다.");
        }

        long totalAmount = 0;
        List<OrderItem> itemsToInsert = new ArrayList<>();

        for (OrderDto.ItemRequest itemReq : request.getOrderItems()) {
            Book book = bookMapper.findById(itemReq.getBookId());
            if (book == null) {
                throw new IllegalArgumentException("존재하지 않는 도서입니다. (bookId: " + itemReq.getBookId() + ")");
            }
            if (book.getStock() < itemReq.getQuantity()) {
                throw new IllegalArgumentException("재고가 부족합니다. (도서명: " + book.getTitle() + ")");
            }

            int rowsAffected = bookMapper.decreaseStock(book.getBookId(), itemReq.getQuantity());
            if (rowsAffected == 0) {
                throw new IllegalArgumentException("재고가 부족합니다. (도서명: " + book.getTitle() + ")");
            }

            long itemPrice = book.getPrice() * itemReq.getQuantity();
            totalAmount += itemPrice;

            OrderItem orderItem = new OrderItem();
            orderItem.setBookId(book.getBookId());
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(book.getPrice());
            itemsToInsert.add(orderItem);
        }

        Order order = new Order();
        order.setMemberId(memberId);
        order.setTotalAmount(totalAmount);
        order.setOrderStatus(OrderStatus.PENDING_PAYMENT);

        orderMapper.insertOrder(order);

        for (OrderItem item : itemsToInsert) {
            item.setOrderId(order.getOrderId());
            orderMapper.insertOrderItem(item);
        }

        return new OrderDto.CreateResponse(order.getOrderId(), order.getTotalAmount(), order.getOrderStatus());
    }
}
