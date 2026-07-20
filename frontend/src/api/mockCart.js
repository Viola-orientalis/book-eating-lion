import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { MOCK_BOOKS } from './mockBooks'

// 실제 백엔드가 붙기 전까지 "서버 DB"를 흉내내는 임시 저장소.
// 사용자별 장바구니 아이템을 { id(=cartItemId), userId, bookId, quantity } 형태로 저장한다.
export const CART_KEY = 'bookmeogeun-mock-cart'

const toResponseItem = (item) => {
  const book = MOCK_BOOKS.find((b) => b.bookId === item.bookId)
  return {
    id: item.id,
    bookId: item.bookId,
    quantity: item.quantity,
    title: book?.title ?? '알 수 없는 도서',
    price: book?.price ?? 0,
  }
}

// 명세에 삭제된 도서 필터링이 없으므로, 여기서는 담긴 그대로를 반환한다.
// (판매 종료 도서 대조는 Cart.jsx/Checkout.jsx가 getBooks()를 다시 조회해 프론트에서 처리)
export const mockGetCart = () => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const mine = readMockList(CART_KEY).filter((i) => i.userId === userId)
  return { data: mine.map(toResponseItem) }
}

export const mockAddCartItem = ({ bookId, quantity }) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const normalizedBookId = Number(bookId)
  const all = readMockList(CART_KEY)
  const existing = all.find((i) => i.userId === userId && i.bookId === normalizedBookId)

  const updated = existing
    ? all.map((i) => (i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i))
    : [...all, { id: nextMockId(all), userId, bookId: normalizedBookId, quantity }]

  writeMockList(CART_KEY, updated)

  const saved = updated.find((i) => i.userId === userId && i.bookId === normalizedBookId)
  return { data: toResponseItem(saved) }
}

export const mockUpdateCartItem = (cartItemId, { quantity }) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const all = readMockList(CART_KEY)
  const item = all.find((i) => i.id === Number(cartItemId) && i.userId === userId)
  if (!item) throw mockApiError('장바구니 항목을 찾을 수 없습니다.', 'CART_ITEM_NOT_FOUND')

  const updatedItem = { ...item, quantity }
  writeMockList(
    CART_KEY,
    all.map((i) => (i.id === updatedItem.id ? updatedItem : i))
  )
  return { data: toResponseItem(updatedItem) }
}

export const mockRemoveCartItem = (cartItemId) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const all = readMockList(CART_KEY)
  const item = all.find((i) => i.id === Number(cartItemId) && i.userId === userId)
  if (!item) throw mockApiError('장바구니 항목을 찾을 수 없습니다.', 'CART_ITEM_NOT_FOUND')

  writeMockList(
    CART_KEY,
    all.filter((i) => i.id !== item.id)
  )
  return { data: {} }
}
