import apiClient from './client'
import { mockCreateOrder, mockGetMyOrders, mockGetOrderDetail } from './mockOrders'

// REQ-04: 주문 생성 (초기 상태 PENDING_PAYMENT)
export const createOrder = async (payload) => {
  try {
    return await apiClient.post('/api/orders', payload)
  } catch {
    // 백엔드 미연결 시 목 주문 생성으로 대체
    return mockCreateOrder(payload)
  }
}
// payload 예시: { orderItems: [{ bookId, quantity }] }
// 응답 예시: { orderId, totalAmount, orderStatus }

// 내 주문 목록 조회
export const getMyOrders = async () => {
  try {
    return await apiClient.get('/api/orders')
  } catch {
    return mockGetMyOrders()
  }
}

export const getOrderDetail = async (orderId) => {
  try {
    return await apiClient.get(`/api/orders/${orderId}`)
  } catch {
    return mockGetOrderDetail(orderId)
  }
}
