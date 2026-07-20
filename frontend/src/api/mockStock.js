import { readMockObject, writeMockObject } from './mockStorage'
import { MOCK_PRODUCTS } from './mockProducts'

// mockProducts.js의 stock은 "초기 재고" 시드값이고, 실제로 남은 재고는
// 이 키 아래 { [productId]: 남은수량 } 형태로 localStorage에서 별도 관리한다.
export const STOCK_LEVELS_KEY = 'bookmeogeun-mock-stock-levels'

const getStockMap = () => {
  const stored = readMockObject(STOCK_LEVELS_KEY)
  if (stored) return stored
  const initial = Object.fromEntries(MOCK_PRODUCTS.map((p) => [p.id, p.stock]))
  writeMockObject(STOCK_LEVELS_KEY, initial)
  return initial
}

export const getMockStock = (productId) => {
  const stockMap = getStockMap()
  return stockMap[productId] ?? 0
}

// getProducts/getProductDetail mock 응답에 현재 재고를 반영
export const withMockStock = (product) => ({
  ...product,
  stock: getMockStock(product.id),
})

export const decrementMockStock = (productId, quantity) => {
  const stockMap = getStockMap()
  stockMap[productId] = Math.max(0, (stockMap[productId] ?? 0) - quantity)
  writeMockObject(STOCK_LEVELS_KEY, stockMap)
}

export const incrementMockStock = (productId, quantity) => {
  const stockMap = getStockMap()
  stockMap[productId] = (stockMap[productId] ?? 0) + quantity
  writeMockObject(STOCK_LEVELS_KEY, stockMap)
}
