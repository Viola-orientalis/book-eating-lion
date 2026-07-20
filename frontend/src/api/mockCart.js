import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { MOCK_PRODUCTS } from './mockProducts'
import { isMockProductDeleted } from './mockDeletedProducts'

// 실제 백엔드가 붙기 전까지 "서버 DB"를 흉내내는 임시 저장소.
// 사용자별 장바구니 아이템을 { id(=cartItemId), userId, productId, quantity } 형태로 저장한다.
export const CART_KEY = 'bookmeogeun-mock-cart'

const productExists = (productId) =>
  MOCK_PRODUCTS.some((p) => p.id === productId) && !isMockProductDeleted(productId)

const toResponseItem = (item) => {
  const product = MOCK_PRODUCTS.find((p) => p.id === item.productId)
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    title: product?.title ?? '알 수 없는 도서',
    price: product?.price ?? 0,
  }
}

export const mockGetCart = () => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.')

  const all = readMockList(CART_KEY)
  const mine = all.filter((i) => i.userId === userId)
  // 판매 종료(삭제)된 상품은 조회 시점에 걸러서 응답하고, 저장소에서도 함께 정리한다
  const valid = mine.filter((i) => productExists(i.productId))
  const removed = mine.filter((i) => !productExists(i.productId))

  if (removed.length > 0) {
    const others = all.filter((i) => i.userId !== userId)
    writeMockList(CART_KEY, [...others, ...valid])
  }

  // removed는 이번 조회에서 방금 걸러낸 것만 담긴다 - 한 번 걸러지면 저장소에서
  // 사라지므로 다음 조회 때는 다시 나타나지 않는다.
  const removedItems = removed.map((i) => ({
    title: MOCK_PRODUCTS.find((p) => p.id === i.productId)?.title ?? '알 수 없는 도서',
  }))

  return { data: { items: valid.map(toResponseItem), removedItems } }
}

export const mockAddCartItem = ({ productId, quantity }) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.')

  const normalizedProductId = Number(productId)
  const all = readMockList(CART_KEY)
  const existing = all.find((i) => i.userId === userId && i.productId === normalizedProductId)

  const updated = existing
    ? all.map((i) => (i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i))
    : [...all, { id: nextMockId(all), userId, productId: normalizedProductId, quantity }]

  writeMockList(CART_KEY, updated)

  const saved = updated.find((i) => i.userId === userId && i.productId === normalizedProductId)
  return { data: toResponseItem(saved) }
}

export const mockUpdateCartItem = (cartItemId, { quantity }) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.')

  const all = readMockList(CART_KEY)
  const item = all.find((i) => i.id === Number(cartItemId) && i.userId === userId)
  if (!item) throw mockApiError('장바구니 항목을 찾을 수 없습니다.')

  const updatedItem = { ...item, quantity }
  writeMockList(
    CART_KEY,
    all.map((i) => (i.id === updatedItem.id ? updatedItem : i))
  )
  return { data: toResponseItem(updatedItem) }
}

export const mockRemoveCartItem = (cartItemId) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.')

  const all = readMockList(CART_KEY)
  const item = all.find((i) => i.id === Number(cartItemId) && i.userId === userId)
  if (!item) throw mockApiError('장바구니 항목을 찾을 수 없습니다.')

  writeMockList(
    CART_KEY,
    all.filter((i) => i.id !== item.id)
  )
  return { data: {} }
}
