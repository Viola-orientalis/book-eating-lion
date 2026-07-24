import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { MOCK_BOOKS } from './mockBooks'
import { getMockStock } from './mockStock'
import apiClient from './client'

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

// 백엔드에 주문 단건 조회 API(GET /api/orders/{orderId})가 없다(OrderController에는
// POST /api/orders, GET /api/orders(목록)만 있음) — 그래서 단건 조회를 시도하면 항상
// 404가 나서 영수증에 "구매 품목 정보를 불러올 수 없습니다"가 뜬다. 대신 이미 있는
// 목록 조회(GET /api/orders, 응답에 orderId별 orderItems 포함)를 불러와 그 안에서 찾는다.
// TODO(디버그용, 원인 확인 끝나면 제거): 실제 값 추적용 console.log
const fetchRemoteOrders = async () => {
  console.log('[영수증 디버그] GET /api/orders 호출 시작')
  try {
    const res = await apiClient.get('/api/orders')
    console.log('[영수증 디버그] GET /api/orders 응답 상태:', res.status, '건수:', res.data?.length, '내용:', res.data)
    return res.data ?? []
  } catch (err) {
    console.log(
      '[영수증 디버그] GET /api/orders 실패:',
      err.response?.status ?? '(응답 없음, 네트워크/타임아웃 에러)',
      err.message
    )
    return []
  }
}

// 영수증/명세서 여러 건을 한 번에 보강할 때 쓰는 배치 버전 — orderId 개수만큼 반복
// 호출해도 실제 목록 조회(GET /api/orders)는 "로컬에 없는 게 하나라도 있을 때" 딱 한 번만
// 나가도록 만든다(월별 명세서에서 결제 건마다 따로 부르면 매번 전체 목록을 다시 받게 됨).
// TODO(디버그용, 원인 확인 끝나면 제거): 실제 값 추적용 console.log
export const resolveOrdersForReceipts = async (orderIds) => {
  const uniqueIds = [...new Set(orderIds.filter(Boolean).map(Number))]
  console.log('[영수증 디버그] resolveOrdersForReceipts 호출, orderIds:', orderIds, '-> 중복 제거:', uniqueIds)

  const result = new Map()
  const missingIds = []

  uniqueIds.forEach((id) => {
    const localOrder = getMockOrderById(id)
    console.log(`[영수증 디버그] orderId=${id} 로컬 mock(ORDERS_KEY) 조회 결과:`, localOrder ?? '(없음)')
    if (localOrder) {
      result.set(id, localOrder)
    } else {
      missingIds.push(id)
    }
  })

  if (missingIds.length > 0) {
    console.log('[영수증 디버그] 로컬에 없는 orderId들, 실제 API로 보강 시도:', missingIds)
    const remoteOrders = await fetchRemoteOrders()
    missingIds.forEach((id) => {
      const found = remoteOrders.find((o) => Number(o.orderId) === id)
      console.log(`[영수증 디버그] orderId=${id} 실제 주문 목록에서 매칭:`, found ?? '(못 찾음 - 이 사용자 주문 목록에 없거나 orderItems가 비어있을 수 있음)')
      if (found) result.set(id, found)
    })
  }

  console.log('[영수증 디버그] resolveOrdersForReceipts 최종 반환값:', result)
  return result
}

// 영수증/명세서용 주문 조회(단건). 로컬 mock 저장소(ORDERS_KEY)에 먼저 찾고, 없으면(=실제
// 백엔드에서 조회한 결제라 로컬에 order_items가 없는 경우) 위 배치 버전을 그대로 재사용한다.
// TODO(디버그용, 원인 확인 끝나면 제거): 실제 값 추적용 console.log
export const resolveOrderForReceipt = async (orderId) => {
  console.log('[영수증 디버그] resolveOrderForReceipt 호출, orderId:', orderId, typeof orderId)
  if (!orderId) {
    console.log('[영수증 디버그] orderId가 없음(null/undefined/0) -> 바로 null 반환')
    return null
  }
  const result = await resolveOrdersForReceipts([orderId])
  const order = result.get(Number(orderId)) ?? null
  console.log('[영수증 디버그] resolveOrderForReceipt 최종 결과:', order)
  return order
}

export const setMockOrderStatus = (orderId, orderStatus) => {
  const orders = readMockList(ORDERS_KEY)
  writeMockList(
    ORDERS_KEY,
    orders.map((o) => (o.id === orderId ? { ...o, orderStatus } : o))
  )
}
