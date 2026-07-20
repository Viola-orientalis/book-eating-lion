import apiClient from './client'
import { mockGetCart, mockAddCartItem, mockUpdateCartItem, mockRemoveCartItem } from './mockCart'

// 내 장바구니 조회 (로그인 필요)
// 응답 형태: { items: [...], removedItems: [{ title }] }
// removedItems는 이번 조회에서 판매 종료(삭제)로 걸러진 상품 목록이다.
export const getCart = async () => {
  try {
    return await apiClient.get('/api/cart')
  } catch {
    // 백엔드 미연결 시 목 장바구니로 대체
    return mockGetCart()
  }
}

// 담기
export const addCartItem = async (payload) => {
  try {
    return await apiClient.post('/api/cart', payload)
  } catch {
    return mockAddCartItem(payload)
  }
}
// payload 예시: { productId, quantity }

// 수량 변경
export const updateCartItem = async (cartItemId, payload) => {
  try {
    return await apiClient.patch(`/api/cart/${cartItemId}`, payload)
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
  await Promise.all(items.map((item) => removeCartItem(item.id)))
}
