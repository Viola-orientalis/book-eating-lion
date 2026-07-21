import apiClient from './client'
import { mockAddCartItem, mockUpdateCartItem, mockRemoveCartItem } from './mockCart'

// 내 장바구니 조회 (로그인 필요). 응답은 배열 그대로 내려온다.
export const getCart = async () => {
  return await apiClient.get('/api/cart')
}

// 담기
export const addCartItem = async (payload) => {
  try {
    return await apiClient.post('/api/cart', payload)
  } catch {
    return mockAddCartItem(payload)
  }
}
// payload 예시: { bookId, quantity }

// 수량 변경
export const updateCartItem = async (cartItemId, payload) => {
  try {
    return await apiClient.put(`/api/cart/${cartItemId}`, payload)
  } catch {
    return mockUpdateCartItem(cartItemId, payload)
  }
}
// payload 예시: { quantity }

// 삭제
export const removeCartItem = async (cartItemId) => {
  try {
    return await apiClient.delete(`/api/cart/${cartItemId}`)
  } catch {
    return mockRemoveCartItem(cartItemId)
  }
}

// 결제 완료 후 장바구니를 비우기 위한 헬퍼. 별도 "전체 삭제" 엔드포인트가 없어
// 개별 삭제 요청을 모아서 보낸다 (실제 백엔드에 벌크 삭제 API가 생기면 교체).
export const clearCartItems = async (items) => {
  await Promise.all(items.map((item) => removeCartItem(item.cartItemId)))
}