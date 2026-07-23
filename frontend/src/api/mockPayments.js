import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { getMockCardById, adjustMockCardUsage } from './mockCards'
import { getMockOrderById, setMockOrderStatus } from './mockOrders'
import { decrementMockStock, incrementMockStock } from './mockStock'
import { USERS_KEY } from './mockAuth'
import { renderElementToPdfUrl, createOffscreenContainer, appendTextLine } from './mockPdf'
import { getStatusLabel } from '../utils/statusLabels'

export const PAYMENTS_KEY = 'bookmeogeun-mock-payments'
export const MERCHANT_NAME = '책 먹는 사자'

const toPaymentResponse = (payment) => ({
  paymentId: payment.id,
  orderId: payment.orderId,
  cardId: payment.cardId,
  amount: payment.amount,
  merchantName: payment.merchantName,
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

// 결제 1건짜리 즉석 영수증. 실제 "명세서"(REQ-08, 기간별)는 statements.js/mockStatements.js로
// 분리했고, 이 함수는 결제내역 페이지의 데모용 즉석 PDF 미리보기 용도로만 남겨둔다.
const buildReceiptElement = (payment, order, buyerName, card) => {
  const el = createOffscreenContainer(600)

  const title = document.createElement('h2')
  title.style.cssText = 'margin:0 0 16px;font-size:18px;'
  title.textContent = `${MERCHANT_NAME} 결제 명세서`
  el.appendChild(title)

  appendTextLine(el, `구매자: ${buyerName ?? '알 수 없음'}`)
  appendTextLine(el, `결제번호: ${payment.id}`)
  appendTextLine(el, `결제일시: ${new Date(payment.createdAt).toLocaleString()}`)
  appendTextLine(el, `결제수단: 신용카드 (${card?.maskedCardNumber ?? '알 수 없음'})`)
  appendTextLine(el, `상태: ${getStatusLabel(payment.status)}`)

  const table = document.createElement('table')
  table.style.cssText =
    'width:100%;border-collapse:collapse;margin-top:16px;border-top:1px solid #ccc;padding-top:8px;'
  ;(order?.orderItems ?? []).forEach((i) => {
    const row = document.createElement('tr')

    const titleCell = document.createElement('td')
    titleCell.style.padding = '4px 0'
    titleCell.textContent = i.title
    row.appendChild(titleCell)

    const qtyCell = document.createElement('td')
    qtyCell.style.cssText = 'padding:4px 0;text-align:center;'
    qtyCell.textContent = `x${i.quantity}`
    row.appendChild(qtyCell)

    const priceCell = document.createElement('td')
    priceCell.style.cssText = 'padding:4px 0;text-align:right;'
    priceCell.textContent = `${(i.price * i.quantity).toLocaleString()}원`
    row.appendChild(priceCell)

    table.appendChild(row)
  })
  el.appendChild(table)

  const total = document.createElement('p')
  total.style.cssText = 'margin-top:16px;font-weight:bold;font-size:14px;'
  total.textContent = `총 결제금액: ${payment.amount.toLocaleString()}원`
  el.appendChild(total)

  return el
}

// 결제 건당 즉석 영수증 다운로드 (데모/미리보기 목적의 임시 구현)
export const mockGetPaymentReceipt = async (paymentId) => {
  const payment = readMockList(PAYMENTS_KEY).find((p) => p.id === Number(paymentId))
  if (!payment) throw mockApiError('결제 내역을 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND')

  const order = getMockOrderById(payment.orderId)
  const buyer = readMockList(USERS_KEY).find((u) => u.id === payment.userId)
  const card = getMockCardById(payment.cardId)

  const element = buildReceiptElement(payment, order, buyer?.name, card)
  const url = await renderElementToPdfUrl(element)
  return { data: { url } }
}
