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
    const res = await apiClient.post('/api/payments/card', payload)
    return res.data
  } catch {
    // 백엔드 미연결 시 목 결제 로직으로 대체. 카드 승인 실패(DECLINED)도 실제 백엔드와
    // 동일하게 { errorCode, message } 형태의 에러로 throw되어 호출부까지 그대로 전달된다.
    const res = mockRequestPayment(payload)
    return res.data
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
// 백엔드에 receipt API 없음 - 프론트 자체 생성만 사용
// fallbackPayment: 실제 백엔드에서 조회한 결제라 로컬 mock 저장소에는 없는 경우를 대비해,
// 화면에 이미 로드되어 있는 결제 목록(payments state)에서 찾은 항목을 넘겨준다.
// buyerName: 실제 백엔드 결제는 응답(HistoryResponse)에 구매자 정보가 없어 로컬 mock
// 유저 테이블에서 못 찾으므로, 로그인한 사용자 이름(호출부의 AuthContext)을 폴백으로 넘긴다.
export const getPaymentReceipt = async (paymentId, fallbackPayment, buyerName) => {
  return mockGetPaymentReceipt(paymentId, fallbackPayment, buyerName)
}

// 카카오페이 결제 준비: orderId로 tid + PC/모바일 리다이렉트 URL을 발급받는다.
// 카드 결제(requestPayment)와 달리 mock 폴백이 없다 - 백엔드에 실제 구현돼 있는
// 엔드포인트라 실패하면 그대로 에러를 던져 호출부(Checkout.jsx)에서 처리한다.
export const requestKakaoPayReady = async ({ orderId }) => {
  return await apiClient.post('/api/payments/kakaopay/ready', { orderId })
}

// 카카오페이 결제 승인: 카카오 결제 페이지에서 돌아온 콜백(pgToken)으로 최종 승인한다.
export const approveKakaoPay = async ({ orderId, tid, pgToken }) => {
  const res = await apiClient.post('/api/payments/kakaopay/approve', { orderId, tid, pgToken })
  return res.data
}

const KAKAO_PAY_SESSION_KEY = 'bookmeogeun-kakaopay-session'

// ready 요청 ~ 카카오 결제 페이지 리다이렉트 ~ 콜백 승인 사이, 페이지를 완전히 벗어났다가
// 돌아오는 동안 유지해야 하는 tid/orderId를 sessionStorage에 잠깐 보관한다.
export const saveKakaoPaySession = ({ orderId, tid }) => {
  sessionStorage.setItem(KAKAO_PAY_SESSION_KEY, JSON.stringify({ orderId, tid }))
}

export const readKakaoPaySession = () => {
  const raw = sessionStorage.getItem(KAKAO_PAY_SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

export const clearKakaoPaySession = () => {
  sessionStorage.removeItem(KAKAO_PAY_SESSION_KEY)
}
