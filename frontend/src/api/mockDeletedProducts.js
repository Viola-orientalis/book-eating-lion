import { readMockList, writeMockList } from './mockStorage'

// 도서 삭제(판매 종료)를 시뮬레이션하기 위한 mock 상태.
// 여기에 포함된 productId는 getProducts/getProductDetail 응답에서 제외된다.
export const DELETED_PRODUCTS_KEY = 'bookmeogeun-mock-deleted-products'

const readDeletedIds = () => readMockList(DELETED_PRODUCTS_KEY)

export const isMockProductDeleted = (productId) =>
  readDeletedIds().includes(Number(productId))

export const markMockProductDeleted = (productId) => {
  const ids = readDeletedIds()
  if (!ids.includes(Number(productId))) {
    writeMockList(DELETED_PRODUCTS_KEY, [...ids, Number(productId)])
  }
}

export const restoreMockProduct = (productId) => {
  writeMockList(
    DELETED_PRODUCTS_KEY,
    readDeletedIds().filter((id) => id !== Number(productId))
  )
}

export const getMockDeletedProductIds = () => readDeletedIds()
