import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { getMockCardById, adjustMockCardUsage } from './mockCards'
import { getMockOrderById, resolveOrderForReceipt, setMockOrderStatus } from './mockOrders'
import { decrementMockStock, incrementMockStock } from './mockStock'
import { USERS_KEY } from './mockAuth'
import { renderReceiptPdf } from './mockPdf'
import { getStatusLabel } from '../utils/statusLabels'

export const PAYMENTS_KEY = 'bookmeogeun-mock-payments'
export const MERCHANT_NAME = '책 먹는 사자'

const toPaymentResponse = (payment) => ({
  paymentId: payment.id,
  orderId: payment.orderId,
  cardId: payment.cardId,
  amount: payment.amount,
  orderTitle: payment.orderTitle,
  status: payment.status,
  createdAt: payment.createdAt,
})

// REQ-06: 카드 결제 요청
// 거절(DECLINED)은 명세상 성공 응답의 필드가 아니라 실패 응답({ errorCode, message })으로
// 내려오므로, 검증에 실패하면 결제 기록을 남기지 않고 바로 에러를 throw한다.
export const mockRequestPayment = ({ orderId, cardId, idempotencyKey }) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const order = getMockOrderById(Number(orderId))
  const card = getMockCardById(Number(cardId))

  const decline = (message, errorCode) => {
    if (order && order.userId === userId) {
      setMockOrderStatus(order.id, 'PAYMENT_FAILED')
    }
    throw mockApiError(message, errorCode)
  }

  // 카드 존재 -> 카드 상태 -> 주문 확인 -> 잔여 한도 순서로 검증
  if (!card || card.userId !== userId) {
    decline('유효하지 않은 카드입니다.', 'CARD_NOT_FOUND')
  }
  if (card.cardStatus !== 'ACTIVE') {
    decline('카드가 정상 상태가 아닙니다.', 'CARD_INACTIVE')
  }
  if (!order || order.userId !== userId) {
    decline('유효하지 않은 주문입니다.', 'ORDER_NOT_FOUND')
  }
  const remainingLimit = card.monthlyLimit - card.currentUsage
  if (remainingLimit < order.totalAmount) {
    decline('카드 한도를 초과했습니다.', 'INSUFFICIENT_LIMIT')
  }

  const payments = readMockList(PAYMENTS_KEY)
  const payment = {
    id: nextMockId(payments),
    userId,
    orderId: order.id,
    cardId: card.cardId,
    amount: order.totalAmount,
    merchantName: MERCHANT_NAME,
    status: 'APPROVED',
    idempotencyKey,
    createdAt: new Date().toISOString(),
  }
  writeMockList(PAYMENTS_KEY, [...payments, payment])

  adjustMockCardUsage(card.cardId, order.totalAmount)
  setMockOrderStatus(order.id, 'PAID')
  order.orderItems.forEach((item) => decrementMockStock(item.bookId, item.quantity))

  return { data: toPaymentResponse(payment) }
}

export const mockCancelPayment = (paymentId, { cancelReason } = {}) => {
  const payments = readMockList(PAYMENTS_KEY)
  const payment = payments.find((p) => p.id === Number(paymentId))
  if (!payment || payment.status !== 'APPROVED') {
    throw mockApiError('취소할 수 없는 결제입니다.', 'PAYMENT_NOT_CANCELLABLE')
  }

  adjustMockCardUsage(payment.cardId, -payment.amount)
  const order = getMockOrderById(payment.orderId)
  order?.orderItems.forEach((item) => incrementMockStock(item.bookId, item.quantity))
  if (order) setMockOrderStatus(order.id, 'CANCELLED')

  const cancelled = { ...payment, status: 'CANCELLED', cancelReason }
  writeMockList(
    PAYMENTS_KEY,
    payments.map((p) => (p.id === payment.id ? cancelled : p))
  )
  return { data: toPaymentResponse(cancelled) }
}

export const mockGetMyPayments = () => {
  const userId = getMockSessionUserId()
  const payments = readMockList(PAYMENTS_KEY)
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { data: payments.map(toPaymentResponse) }
}

// 화면에 이미 로드된 결제 목록을 내부에서 쓰는 raw 저장 형태({ id, merchantName,
// createdAt, ... })에 맞춰 변환한다. 화면 목록은 실제 백엔드 응답(PaymentDto.HistoryResponse:
// { paymentId, orderId, cardId, amount, orderTitle, status, approvedAt })을 그대로 쓰고
// 있으므로(Payments.jsx도 p.orderTitle/p.approvedAt을 읽음), merchantName이 아니라
// orderTitle, createdAt이 아니라 approvedAt에서 값을 가져와야 한다.
const normalizeFallbackPayment = (payment) => ({
  id: payment.paymentId,
  orderId: payment.orderId,
  cardId: payment.cardId,
  amount: payment.amount,
  merchantName: payment.orderTitle,
  status: payment.status,
  createdAt: payment.approvedAt,
})

// 결제 건당 즉석 영수증 다운로드 (데모/미리보기 목적의 임시 구현)
// 실제 백엔드에서 조회한 결제는 로컬 mock 저장소(PAYMENTS_KEY)에 없으므로, 거기서 못 찾으면
// 화면에 이미 로드되어 있던 결제 데이터(fallbackPayment)로 대체해 PDF를 생성한다.
// buyerName: 실제 백엔드 결제는 로컬 mock 유저 테이블(USERS_KEY)에 대응하는 userId가 없어
// 구매자를 못 찾으므로, 호출부(Payments.jsx)에서 로그인 사용자 이름을 폴백으로 넘겨준다.
// 로컬 mock 결제는 기존처럼 USERS_KEY 조회가 우선이고, 이건 그 조회가 실패했을 때만 쓰인다.
export const mockGetPaymentReceipt = async (paymentId, fallbackPayment, buyerName) => {
  const stored = readMockList(PAYMENTS_KEY).find((p) => p.id === Number(paymentId))
  const payment = stored ?? (fallbackPayment && normalizeFallbackPayment(fallbackPayment))
  if (!payment) throw mockApiError('결제 내역을 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND')

  const order = await resolveOrderForReceipt(payment.orderId)
  const buyer = readMockList(USERS_KEY).find((u) => u.id === payment.userId)
  const card = getMockCardById(payment.cardId)

  const url = await renderReceiptPdf({
    merchantName: payment.merchantName || MERCHANT_NAME,
    buyerName: buyer?.name || buyerName,
    paymentId: payment.id,
    approvalNumber: payment.approvalNumber,
    createdAt: payment.createdAt,
    maskedCardNumber: card?.maskedCardNumber,
    statusLabel: getStatusLabel(payment.status),
    items: order?.orderItems,
    amount: payment.amount,
  })
  return { data: { url } }
}
