import apiClient from './client'
import {
  mockRequestPayment,
  mockCancelPayment,
  mockGetMyPayments,
  mockGetPaymentReceipt,
} from './mockPayments'

// REQ-06: 카드 결제 요청 (카드 유효성 -> 상태 -> 한도 검증 후 승인, 거절은 에러 응답)
// payload: { orderId, cardId }. idempotencyKey는 매 요청마다 새로 생성해 함께 보낸다.
export const requestPayment = async ({ orderId, cardId }) => {
  const idempotencyKey = crypto.randomUUID()
  const payload = { orderId, cardId, idempotencyKey }
  try {
    return await apiClient.post('/api/payments/card', payload)
  } catch {
    // 백엔드 미연결 시 목 결제 로직으로 대체. 카드 승인 실패(DECLINED)도 실제 백엔드와
    // 동일하게 { errorCode, message } 형태의 에러로 throw되어 호출부까지 그대로 전달된다.
    return mockRequestPayment(payload)
  }
}

// REQ-07: 결제 취소 (환불). 취소 사유가 필요하다.
export const cancelPayment = async (paymentId, cancelReason = '고객 변심') => {
  try {
    return await apiClient.post(`/api/payments/${paymentId}/cancel`, { cancelReason })
  } catch {
    return mockCancelPayment(paymentId, { cancelReason })
  }
}

// REQ-08: 결제 내역 조회
export const getMyPayments = async () => {
  try {
    return await apiClient.get('/api/payments')
  } catch {
    return mockGetMyPayments()
  }
}

// REQ-08: 결제 건당 즉석 명세서 다운로드 (데모/미리보기 용도로 유지)
// 기간별 "명세서" 목록/다운로드는 statements.js를 사용한다.
export const getPaymentReceipt = async (paymentId) => {
  try {
    return await apiClient.get(`/api/payments/${paymentId}/receipt`)
  } catch {
    return mockGetPaymentReceipt(paymentId)
  }
}

// 차후 구현: 카카오페이 연동 (POST /api/kakaopay/ready, POST /api/kakaopay/approve)
// 이번 스코프에서는 카드 결제만 구현한다.
