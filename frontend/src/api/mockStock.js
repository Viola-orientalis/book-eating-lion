import { readMockObject, writeMockObject } from './mockStorage'
import { MOCK_BOOKS } from './mockBooks'

// mockBooks.js의 stock은 "초기 재고" 시드값이고, 실제로 남은 재고는
// 이 키 아래 { [bookId]: 남은수량 } 형태로 localStorage에서 별도 관리한다.
export const STOCK_LEVELS_KEY = 'bookmeogeun-mock-stock-levels'

const getStockMap = () => {
  const stored = readMockObject(STOCK_LEVELS_KEY)
  if (stored) return stored
  const initial = Object.fromEntries(MOCK_BOOKS.map((b) => [b.bookId, b.stock]))
  writeMockObject(STOCK_LEVELS_KEY, initial)
  return initial
}

export const getMockStock = (bookId) => {
  const stockMap = getStockMap()
  return stockMap[bookId] ?? 0
}

// getBooks/getBookDetail mock 응답에 현재 재고를 반영
export const withMockStock = (book) => ({
  ...book,
  stock: getMockStock(book.bookId),
})

export const decrementMockStock = (bookId, quantity) => {
  const stockMap = getStockMap()
  stockMap[bookId] = Math.max(0, (stockMap[bookId] ?? 0) - quantity)
  writeMockObject(STOCK_LEVELS_KEY, stockMap)
}

export const incrementMockStock = (bookId, quantity) => {
  const stockMap = getStockMap()
  stockMap[bookId] = (stockMap[bookId] ?? 0) + quantity
  writeMockObject(STOCK_LEVELS_KEY, stockMap)
}
