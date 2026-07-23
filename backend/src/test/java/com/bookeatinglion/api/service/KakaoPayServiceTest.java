package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.PaymentDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("all")
@ExtendWith(MockitoExtension.class)
class KakaoPayServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private KakaoPayService kakaoPayService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(kakaoPayService, "secretKey", "TEST_SECRET_KEY");
        ReflectionTestUtils.setField(kakaoPayService, "cid", "TC0ONETIME");
        ReflectionTestUtils.setField(kakaoPayService, "apiUrl", "https://open-api.kakaopay.com");
    }

    @Test
    void ready_Success_ShouldCallKakaoPayReadyApi() {
        // Arrange
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("tid", "T123456789");
        mockResponse.put("next_redirect_pc_url", "http://pc-redirect");
        mockResponse.put("next_redirect_mobile_url", "http://mobile-redirect");

        when(restTemplate.postForEntity(eq("https://open-api.kakaopay.com/online/v1/payment/ready"), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(mockResponse));

        // Act
        PaymentDto.KakaoReadyResponse response = kakaoPayService.ready(100L, 200L, 5000L, "테스트 도서");

        // Assert
        assertNotNull(response);
        assertEquals("T123456789", response.getTid());
        assertEquals("http://pc-redirect", response.getNextRedirectPcUrl());
        assertEquals("http://mobile-redirect", response.getNextRedirectMobileUrl());

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).postForEntity(anyString(), captor.capture(), eq(Map.class));

        HttpEntity<Map<String, Object>> capturedEntity = captor.getValue();
        HttpHeaders headers = capturedEntity.getHeaders();
        assertEquals("SECRET_KEY TEST_SECRET_KEY", headers.getFirst("Authorization"));
        assertEquals("application/json", headers.getFirst("Content-Type"));

        Map<String, Object> body = capturedEntity.getBody();
        assertEquals("TC0ONETIME", body.get("cid"));
        assertEquals("200", body.get("partner_order_id"));
        assertEquals("100", body.get("partner_user_id"));
        assertEquals("테스트 도서", body.get("item_name"));
        assertEquals(5000L, body.get("total_amount"));
    }

    @Test
    void approve_Success_ShouldCallKakaoPayApproveApi() {
        // Arrange
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("aid", "A987654321");
        mockResponse.put("tid", "T123456789");
        
        Map<String, Object> mockCardInfo = new HashMap<>();
        mockCardInfo.put("approved_id", "CARD_APPROVAL_123");
        mockResponse.put("card_info", mockCardInfo);

        when(restTemplate.postForEntity(eq("https://open-api.kakaopay.com/online/v1/payment/approve"), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(mockResponse));

        // Act
        String approvalNo = kakaoPayService.approve(100L, 200L, "T123456789", "pg-token-value");

        // Assert
        assertEquals("CARD_APPROVAL_123", approvalNo);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).postForEntity(anyString(), captor.capture(), eq(Map.class));

        HttpEntity<Map<String, Object>> capturedEntity = captor.getValue();
        Map<String, Object> body = capturedEntity.getBody();
        assertEquals("TC0ONETIME", body.get("cid"));
        assertEquals("T123456789", body.get("tid"));
        assertEquals("200", body.get("partner_order_id"));
        assertEquals("100", body.get("partner_user_id"));
        assertEquals("pg-token-value", body.get("pg_token"));
    }

    @Test
    void cancel_Success_ShouldCallKakaoPayCancelApi() {
        // Arrange
        when(restTemplate.postForEntity(eq("https://open-api.kakaopay.com/online/v1/payment/cancel"), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(new HashMap<>()));

        // Act
        assertDoesNotThrow(() -> kakaoPayService.cancel("T123456789", 5000L, "고객 변심"));

        // Assert
        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).postForEntity(anyString(), captor.capture(), eq(Map.class));

        HttpEntity<Map<String, Object>> capturedEntity = captor.getValue();
        Map<String, Object> body = capturedEntity.getBody();
        assertEquals("TC0ONETIME", body.get("cid"));
        assertEquals("T123456789", body.get("tid"));
        assertEquals(5000L, body.get("cancel_amount"));
    }
}
