import apiClient from './client'
import { MOCK_PRODUCTS } from './mockProducts'
import { withMockStock } from './mockStock'
import { isMockProductDeleted } from './mockDeletedProducts'

// REQ-03: 상품 목록 조회
export const getProducts = async () => {
  try {
    return await apiClient.get('/api/products')
  } catch {
    // 백엔드 미연결 시 목 데이터로 대체 (현재 재고 반영, 삭제된 상품 제외)
    return {
      data: MOCK_PRODUCTS.filter((p) => !isMockProductDeleted(p.id)).map(withMockStock),
    }
  }
}

// REQ-03: 상품 상세 조회
export const getProductDetail = async (productId) => {
  try {
    return await apiClient.get(`/api/products/${productId}`)
  } catch {
    // 백엔드 미연결 시 목 데이터에서 조회 (현재 재고 반영, 삭제된 상품은 없는 것으로 처리)
    const product = MOCK_PRODUCTS.find((p) => p.id === Number(productId))
    if (!product || isMockProductDeleted(product.id)) {
      return { data: null }
    }
    return { data: withMockStock(product) }
  }
}
