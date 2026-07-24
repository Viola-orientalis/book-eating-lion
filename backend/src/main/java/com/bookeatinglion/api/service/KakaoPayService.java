package com.bookeatinglion.api.service;

import com.bookeatinglion.api.dto.PaymentDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@SuppressWarnings({ "rawtypes", "unchecked" })
public class KakaoPayService {

    @Value("${kakaopay.secret-key}")
    private String secretKey;

    @Value("${kakaopay.cid:TC0ONETIME}")
    private String cid;

    @Value("${kakaopay.api-url:https://open-api.kakaopay.com}")
    private String apiUrl;

    @Value("${app.frontend-url:https://ajttk.com}")
    private String frontendUrl;

    private final RestTemplate restTemplate;

    public KakaoPayService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // KakaoPay 결제 준비
    public PaymentDto.KakaoReadyResponse ready(Long memberId, Long orderId, Long totalAmount, String itemName) {
        String url = apiUrl + "/online/v1/payment/ready";

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("cid", cid);
        parameters.put("partner_order_id", String.valueOf(orderId));
        parameters.put("partner_user_id", String.valueOf(memberId));
        parameters.put("item_name", itemName);
        parameters.put("quantity", 1);
        parameters.put("total_amount", totalAmount);
        parameters.put("tax_free_amount", 0);

        // redirect URLs pointing to the frontend
        parameters.put("approval_url", frontendUrl + "/checkout?status=success&orderId=" + orderId);
        parameters.put("cancel_url", frontendUrl + "/checkout?status=cancel&orderId=" + orderId);
        parameters.put("fail_url", frontendUrl + "/checkout?status=fail&orderId=" + orderId);

        HttpHeaders headers = getHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(parameters, headers);

        try {
            log.info("[KakaoPay Ready Request] url: {}, params: {}", url, parameters);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new IllegalArgumentException("카카오페이 준비 요청 응답이 비어있습니다.");
            }

            String tid = (String) body.get("tid");
            String pcUrl = (String) body.get("next_redirect_pc_url");
            String mobileUrl = (String) body.get("next_redirect_mobile_url");

            log.info("[KakaoPay Ready Response] tid: {}, pcUrl: {}", tid, pcUrl);
            return new PaymentDto.KakaoReadyResponse(tid, pcUrl, mobileUrl);
        } catch (Exception e) {
            log.error("[KakaoPay Ready Error] message: {}", e.getMessage(), e);
            throw new IllegalArgumentException("카카오페이 결제 준비 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // KakaoPay 결제 승인
    public String approve(Long memberId, Long orderId, String tid, String pgToken) {
        String url = apiUrl + "/online/v1/payment/approve";

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("cid", cid);
        parameters.put("tid", tid);
        parameters.put("partner_order_id", String.valueOf(orderId));
        parameters.put("partner_user_id", String.valueOf(memberId));
        parameters.put("pg_token", pgToken);

        HttpHeaders headers = getHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(parameters, headers);

        try {
            log.info("[KakaoPay Approve Request] url: {}, params: {}", url, parameters);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new IllegalArgumentException("카카오페이 승인 요청 응답이 비어있습니다.");
            }

            // Extract approval_number or aid or tid
            String approvalNumber = (String) body.get("aid"); // aid is always present

            // if there is card_info, try to get approved_id (approval number)
            if (body.containsKey("card_info")) {
                Map<String, Object> cardInfo = (Map<String, Object>) body.get("card_info");
                if (cardInfo != null && cardInfo.containsKey("approved_id")) {
                    approvalNumber = (String) cardInfo.get("approved_id");
                }
            }

            log.info("[KakaoPay Approve Response] approvalNumber: {}", approvalNumber);
            return approvalNumber;
        } catch (Exception e) {
            log.error("[KakaoPay Approve Error] message: {}", e.getMessage(), e);
            throw new IllegalArgumentException("카카오페이 결제 승인 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // KakaoPay 결제 취소
    public void cancel(String tid, Long cancelAmount, String cancelReason) {
        String url = apiUrl + "/online/v1/payment/cancel";

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("cid", cid);
        parameters.put("tid", tid);
        parameters.put("cancel_amount", cancelAmount);
        parameters.put("cancel_tax_free_amount", 0);

        HttpHeaders headers = getHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(parameters, headers);

        try {
            log.info("[KakaoPay Cancel Request] url: {}, params: {}", url, parameters);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            log.info("[KakaoPay Cancel Response] status: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("[KakaoPay Cancel Error] message: {}", e.getMessage(), e);
            throw new IllegalArgumentException("카카오페이 결제 취소 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "SECRET_KEY " + secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
