import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { getMockCardById, adjustMockCardLimit } from './mockCards'
import { getMockOrderById, markMockOrderCompleted } from './mockOrders'
import { decrementMockStock, incrementMockStock } from './mockStock'
import { USERS_KEY } from './mockAuth'

export const PAYMENTS_KEY = 'bookmeogeun-mock-payments'
const MERCHANT_NAME = '책 먹는 사자'

export const mockRequestPayment = ({ orderId, cardId }) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.')

  const order = getMockOrderById(Number(orderId))
  const card = getMockCardById(Number(cardId))
  const payments = readMockList(PAYMENTS_KEY)

  const buildPayment = (status, rejectReason) => ({
    id: nextMockId(payments),
    userId,
    orderId: Number(orderId),
    cardId: Number(cardId),
    amount: order?.totalPrice ?? 0,
    merchantName: MERCHANT_NAME,
    status,
    rejectReason,
    createdAt: new Date().toISOString(),
  })

  // REQ-06: 카드 존재 -> 카드 상태 -> 잔여 한도 순서로 검증
  let payment
  if (!card || card.userId !== userId) {
    payment = buildPayment('REJECTED', '유효하지 않은 카드입니다.')
  } else if (card.status !== 'ACTIVE') {
    payment = buildPayment('REJECTED', '카드가 정상 상태가 아닙니다.')
  } else if (!order || order.userId !== userId) {
    payment = buildPayment('REJECTED', '유효하지 않은 주문입니다.')
  } else if (card.remainingLimit < order.totalPrice) {
    payment = buildPayment('REJECTED', '카드 한도를 초과했습니다.')
  } else {
    payment = buildPayment('APPROVED', null)
    adjustMockCardLimit(card.id, -order.totalPrice)
    markMockOrderCompleted(order.id)
    order.items.forEach((item) => decrementMockStock(item.productId, item.quantity))
  }

  writeMockList(PAYMENTS_KEY, [...payments, payment])
  return { data: payment }
}

export const mockCancelPayment = (paymentId) => {
  const payments = readMockList(PAYMENTS_KEY)
  const payment = payments.find((p) => p.id === Number(paymentId))
  if (!payment || payment.status !== 'APPROVED') {
    throw mockApiError('취소할 수 없는 결제입니다.')
  }

  adjustMockCardLimit(payment.cardId, payment.amount)
  const order = getMockOrderById(payment.orderId)
  order?.items.forEach((item) => incrementMockStock(item.productId, item.quantity))
  const cancelled = { ...payment, status: 'CANCELLED' }
  writeMockList(
    PAYMENTS_KEY,
    payments.map((p) => (p.id === payment.id ? cancelled : p))
  )
  return { data: cancelled }
}

export const mockGetMyPayments = () => {
  const userId = getMockSessionUserId()
  const payments = readMockList(PAYMENTS_KEY)
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { data: payments }
}

// 명세서에 표시할 내용을 실제 DOM으로 그려서 html2canvas로 캡처한 뒤 이미지로 PDF에 삽입한다.
// jsPDF 기본 폰트(Helvetica 등)는 한글 글리프가 없어 doc.text()로 직접 그리면 한글이 깨지므로,
// 브라우저가 렌더링한 화면을 이미지로 캡처하는 방식을 쓴다.
// (jsPDF.html()은 내부적으로 같은 걸 하지만 Promise가 이미지 삽입 완료 전에 resolve되는
// 경우가 있어 백지 PDF가 나왔다. html2canvas를 직접 호출해 canvas -> addImage 순서를
// 명시적으로 await로 보장하는 방식으로 바꾼다.)
// (트레이드오프: 텍스트 선택/복사가 안 되는 이미지 기반 PDF가 된다)
// buyerName/i.title 등은 회원가입 폼 입력값·상품명이 그대로 흘러온 값이라
// innerHTML 문자열 템플릿으로 조립하면 XSS 위험이 있다. textContent만 쓰는
// DOM API로 조립해서 어떤 값이 들어와도 HTML로 해석되지 않게 한다.
const addLine = (parent, text) => {
  const p = document.createElement('p')
  p.style.margin = '4px 0'
  p.textContent = text
  parent.appendChild(p)
}

const buildReceiptElement = (payment, order, buyerName) => {
  const el = document.createElement('div')
  // opacity:0은 html2canvas가 계산된 스타일을 그대로 반영해 투명하게(=백지로) 캡처하는
  // 원인이 될 수 있다. opacity는 1로 유지하고, 화면 밖(left:-99999px)으로만 밀어낸다.
  // width/backgroundColor/color도 상속에 기대지 않고 인라인으로 명시한다.
  el.style.cssText =
    'position:fixed;top:0;left:-99999px;width:600px;padding:24px;background-color:#ffffff;color:#000000;font-family:sans-serif;font-size:12px;'

  const title = document.createElement('h2')
  title.style.cssText = 'margin:0 0 16px;font-size:18px;'
  title.textContent = `${MERCHANT_NAME} 결제 명세서`
  el.appendChild(title)

  addLine(el, `구매자: ${buyerName ?? '알 수 없음'}`)
  addLine(el, `결제번호: ${payment.id}`)
  addLine(el, `결제일시: ${new Date(payment.createdAt).toLocaleString()}`)
  addLine(el, `상태: ${payment.status}`)

  const table = document.createElement('table')
  table.style.cssText =
    'width:100%;border-collapse:collapse;margin-top:16px;border-top:1px solid #ccc;padding-top:8px;'
  ;(order?.items ?? []).forEach((i) => {
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

// REQ-08: 결제 명세서 다운로드 (PDF)
// 데모/미리보기 목적의 임시 구현. 실제 백엔드(S3에 업로드된 PDF URL)가 붙으면
// payments.js의 axios 경로가 성공하므로 이 mock 로직은 더 이상 호출되지 않는다.
export const mockGetPaymentReceipt = async (paymentId) => {
  const payment = readMockList(PAYMENTS_KEY).find((p) => p.id === Number(paymentId))
  if (!payment) throw mockApiError('결제 내역을 찾을 수 없습니다.')

  const order = getMockOrderById(payment.orderId)
  const buyer = readMockList(USERS_KEY).find((u) => u.id === payment.userId)

  const element = buildReceiptElement(payment, order, buyer?.name)
  document.body.appendChild(element)

  try {
    // 붙인 직후에는 브라우저가 아직 레이아웃/페인트를 끝내지 않았을 수 있어
    // 한 프레임 대기한 뒤 캡처한다.
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 })
    const imageData = canvas.toDataURL('image/png')

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 24
    const imageWidth = doc.internal.pageSize.getWidth() - margin * 2
    const imageHeight = (canvas.height / canvas.width) * imageWidth
    doc.addImage(imageData, 'PNG', margin, margin, imageWidth, imageHeight)

    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    return { data: { url } }
  } finally {
    document.body.removeChild(element)
  }
}
