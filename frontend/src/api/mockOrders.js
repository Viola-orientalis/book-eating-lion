import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { MOCK_BOOKS } from './mockBooks'
import { getMockStock } from './mockStock'

export const ORDERS_KEY = 'bookmeogeun-mock-orders'

const toCreateResponse = (order) => ({
  orderId: order.id,
  totalAmount: order.totalAmount,
  orderStatus: order.orderStatus,
})

export const mockCreateOrder = ({ orderItems }) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  // 재고 검증: 요청 수량이 현재 재고를 초과하면 주문 생성 자체를 막는다
  const insufficient = orderItems.find(
    ({ bookId, quantity }) => quantity > getMockStock(Number(bookId))
  )
  if (insufficient) {
    throw mockApiError('재고가 부족합니다', 'OUT_OF_STOCK')
  }

  const items = orderItems.map(({ bookId, quantity }) => {
    const book = MOCK_BOOKS.find((b) => b.bookId === Number(bookId))
    return {
      bookId: Number(bookId),
      quantity,
      title: book?.title ?? '알 수 없는 도서',
      price: book?.price ?? 0,
    }
  })
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const orders = readMockList(ORDERS_KEY)
  const order = {
    id: nextMockId(orders),
    userId,
    orderItems: items,
    totalAmount,
    orderStatus: 'PENDING_PAYMENT',
    createdAt: new Date().toISOString(),
  }
  writeMockList(ORDERS_KEY, [...orders, order])
  return { data: toCreateResponse(order) }
}

export const mockGetMyOrders = () => {
  const userId = getMockSessionUserId()
  const orders = readMockList(ORDERS_KEY).filter((o) => o.userId === userId)
  return { data: orders }
}

export const mockGetOrderDetail = (orderId) => {
  const order = readMockList(ORDERS_KEY).find((o) => o.id === Number(orderId))
  if (!order) throw mockApiError('주문을 찾을 수 없습니다.', 'ORDER_NOT_FOUND')
  return { data: order }
}

// 결제 승인/취소 로직(mockPayments)에서 참조하는 내부 헬퍼
export const getMockOrderById = (orderId) =>
  readMockList(ORDERS_KEY).find((o) => o.id === orderId)

export const setMockOrderStatus = (orderId, orderStatus) => {
  const orders = readMockList(ORDERS_KEY)
  writeMockList(
    ORDERS_KEY,
    orders.map((o) => (o.id === orderId ? { ...o, orderStatus } : o))
  )
}
