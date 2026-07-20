import apiClient from './client'
import {
  mockRequestPayment,
  mockCancelPayment,
  mockGetMyPayments,
  mockGetPaymentReceipt,
} from './mockPayments'

// REQ-06: 결제 승인 요청 (카드 유효성 -> 상태 -> 한도 검증 후 승인/거절)
export const requestPayment = async (payload) => {
  try {
    return await apiClient.post('/api/payments', payload)
  } catch {
    // 백엔드 미연결 시 목 결제 승인/거절 로직으로 대체
    return mockRequestPayment(payload)
  }
}
// payload 예시: { orderId, cardId }

// REQ-07: 결제 취소 (환불)
export const cancelPayment = async (paymentId) => {
  try {
    return await apiClient.post(`/api/payments/${paymentId}/cancel`)
  } catch {
    return mockCancelPayment(paymentId)
  }
}

// REQ-08: 결제 내역 조회
export const getMyPayments = async () => {
  try {
    return await apiClient.get('/api/payments/me')
  } catch {
    return mockGetMyPayments()
  }
}

// REQ-08: 결제 명세서 다운로드 (S3에 업로드된 파일 URL 반환)
export const getPaymentReceipt = async (paymentId) => {
  try {
    return await apiClient.get(`/api/payments/${paymentId}/receipt`)
  } catch {
    return mockGetPaymentReceipt(paymentId)
  }
}
