package com.bookeatinglion.api.service;

import com.bookeatinglion.api.domain.*;
import com.bookeatinglion.api.dto.OrderDto;
import com.bookeatinglion.api.dto.PaymentDto;
import com.bookeatinglion.api.mapper.BookMapper;
import com.bookeatinglion.api.mapper.CardMapper;
import com.bookeatinglion.api.mapper.OrderMapper;
import com.bookeatinglion.api.mapper.PaymentMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderAndPaymentServiceTest {

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private BookMapper bookMapper;

    @Mock
    private CardMapper cardMapper;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private KakaoPayService kakaoPayService;

    @InjectMocks
    private OrderServiceImpl orderService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Book testBook;
    private Card testCard;
    private Order testOrder;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        testBook = new Book();
        testBook.setBookId(1L);
        testBook.setTitle("테스트 책");
        testBook.setPrice(10000L);
        testBook.setStock(5);
        testBook.setSaleStatus("ON_SALE");

        testCard = new Card();
        testCard.setCardId(10L);
        testCard.setMemberId(100L);
        testCard.setMonthlyLimit(50000L);
        testCard.setCurrentUsage(0L);
        testCard.setCardStatus(CardStatus.ACTIVE);

        testOrder = new Order();
        testOrder.setOrderId(200L);
        testOrder.setMemberId(100L);
        testOrder.setTotalAmount(20000L);
        testOrder.setOrderStatus(OrderStatus.PENDING_PAYMENT);

        testPayment = new Payment();
        testPayment.setPaymentId(300L);
        testPayment.setOrderId(200L);
        testPayment.setCardId(10L);
        testPayment.setPaymentMethod(PaymentMethod.CARD);
        testPayment.setAmount(20000L);
        testPayment.setPaymentStatus(PaymentStatus.APPROVED);
    }

    @Test
    void createOrder_Success_ShouldDecreaseStock() {
        // Arrange
        OrderDto.CreateRequest request = new OrderDto.CreateRequest();
        List<OrderDto.ItemRequest> items = new ArrayList<>();
        items.add(new OrderDto.ItemRequest(1L, 2));
        request.setOrderItems(items);

        when(bookMapper.findById(1L)).thenReturn(testBook);
        when(bookMapper.decreaseStock(1L, 2)).thenReturn(1);
        doNothing().when(orderMapper).insertOrder(any(Order.class));
        doNothing().when(orderMapper).insertOrderItem(any(OrderItem.class));

        // Act
        OrderDto.CreateResponse response = orderService.createOrder(100L, request);

        // Assert
        assertNotNull(response);
        verify(bookMapper, times(1)).decreaseStock(1L, 2);
        verify(orderMapper, times(1)).insertOrder(any(Order.class));
    }

    @Test
    void createOrder_Fail_WhenStockInsufficient() {
        // Arrange
        OrderDto.CreateRequest request = new OrderDto.CreateRequest();
        List<OrderDto.ItemRequest> items = new ArrayList<>();
        items.add(new OrderDto.ItemRequest(1L, 10)); // Requesting 10 but stock is 5
        request.setOrderItems(items);

        when(bookMapper.findById(1L)).thenReturn(testBook);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(100L, request));
        assertTrue(exception.getMessage().contains("재고가 부족합니다"));
        verify(bookMapper, never()).decreaseStock(any(), anyInt());
    }

    @Test
    void createOrder_Fail_WhenStockDecreaseRaceCondition() {
        // Arrange
        OrderDto.CreateRequest request = new OrderDto.CreateRequest();
        List<OrderDto.ItemRequest> items = new ArrayList<>();
        items.add(new OrderDto.ItemRequest(1L, 2));
        request.setOrderItems(items);

        when(bookMapper.findById(1L)).thenReturn(testBook);
        when(bookMapper.decreaseStock(1L, 2)).thenReturn(0); // Concurrent execution decreasestock fails

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(100L, request));
        assertTrue(exception.getMessage().contains("재고가 부족합니다"));
    }

    @Test
    void payWithCard_Success_ShouldUpdateUsageWithLimit() {
        // Arrange
        PaymentDto.CardPayRequest request = new PaymentDto.CardPayRequest(200L, 10L, "idempotency-key");

        when(orderMapper.findById(200L)).thenReturn(Optional.of(testOrder));
        when(cardMapper.findById(10L)).thenReturn(Optional.of(testCard));
        when(cardMapper.updateUsageWithLimit(10L, 20000L)).thenReturn(1);
        doNothing().when(orderMapper).updateStatus(200L, OrderStatus.PAID);
        doNothing().when(paymentMapper).insertPayment(any(Payment.class));

        // Act
        PaymentDto.PayResponse response = paymentService.payWithCard(100L, request);

        // Assert
        assertNotNull(response);
        assertEquals(PaymentStatus.APPROVED, response.getStatus());
        verify(cardMapper, times(1)).updateUsageWithLimit(10L, 20000L);
        verify(orderMapper, times(1)).updateStatus(200L, OrderStatus.PAID);
    }

    @Test
    void payWithCard_Fail_WhenLimitExceeded() {
        // Arrange
        PaymentDto.CardPayRequest request = new PaymentDto.CardPayRequest(200L, 10L, "idempotency-key");

        when(orderMapper.findById(200L)).thenReturn(Optional.of(testOrder));
        when(cardMapper.findById(10L)).thenReturn(Optional.of(testCard));
        when(cardMapper.updateUsageWithLimit(10L, 20000L)).thenReturn(0); // Fails (limit exceeded or status suspended)

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> paymentService.payWithCard(100L, request));
        assertTrue(exception.getMessage().contains("카드 잔여 한도가 부족하거나"));
        verify(orderMapper, never()).updateStatus(any(), any());
    }

    @Test
    void cancelPayment_Success_ShouldRestoreCardUsageAndBookStock() {
        // Arrange
        PaymentDto.CancelRequest request = new PaymentDto.CancelRequest("고객 변심");

        when(paymentMapper.findById(300L)).thenReturn(Optional.of(testPayment));
        when(orderMapper.findById(200L)).thenReturn(Optional.of(testOrder));
        when(cardMapper.restoreUsage(10L, 20000L)).thenReturn(1);

        OrderItem item = new OrderItem();
        item.setBookId(1L);
        item.setQuantity(2);
        when(orderMapper.findItemsByOrderId(200L)).thenReturn(List.of(item));
        when(bookMapper.increaseStock(1L, 2)).thenReturn(1);

        doNothing().when(orderMapper).updateStatus(200L, OrderStatus.CANCELLED);
        doNothing().when(paymentMapper).updateStatus(300L, PaymentStatus.CANCELLED, "고객 변심");

        // Act
        paymentService.cancelPayment(100L, 300L, request);

        // Assert
        verify(cardMapper, times(1)).restoreUsage(10L, 20000L);
        verify(bookMapper, times(1)).increaseStock(1L, 2);
        verify(orderMapper, times(1)).updateStatus(200L, OrderStatus.CANCELLED);
        verify(paymentMapper, times(1)).updateStatus(300L, PaymentStatus.CANCELLED, "고객 변심");
    }
}
