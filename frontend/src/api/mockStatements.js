import apiClient from './client'
import { readMockList, mockApiError } from './mockStorage'
import { getMockSessionUserId, isMockOrRealSessionActive } from './mockSession'
import { PAYMENTS_KEY, MERCHANT_NAME } from './mockPayments'
import { getMockCardById } from './mockCards'
import { resolveOrdersForReceipts } from './mockOrders'
import {
  PDF_MARGIN,
  formatWon,
  drawHeader,
  drawLabelValueRow,
  drawDashedDivider,
  drawSolidDivider,
  drawTotalRow,
  drawThankYouFooter,
  tableTheme,
  renderVectorPdf,
} from './receiptPdfKit'

// 결제 1건짜리 영수증(mockPayments.js)과 달리, "명세서"는 기간(월) 단위로 결제를
// 묶어서 만든다. 별도로 저장하지 않고 statementId(="YYYY-MM")로부터 그때그때 계산한다.
const toMonthKey = (date) => date.toISOString().slice(0, 7)
const toDateOnly = (date) => date.toISOString().slice(0, 10)

// 결제 건의 주문에 담긴 도서명을 표에 넣기 좋은 한 줄로 축약한다.
// 여러 권이면 "첫 권 외 N권" 형태로, 품목 정보를 못 가져온 경우 "-"로 대체한다.
const summarizeOrderItems = (order) => {
  const items = order?.orderItems ?? []
  if (items.length === 0) return '-'
  if (items.length === 1) return items[0].title
  return `${items[0].title} 외 ${items.length - 1}권`
}

// 표 안에서는 "9876-****-****-1234"(19자)처럼 긴 마스킹 번호 대신 뒤 4자리만 보여준다.
// 결제내역 화면/단건 영수증의 라벨-값 줄은 한 줄 전체 폭을 쓸 수 있어 원래 형식을
// 그대로 유지하고, 여기(좁은 표 컬럼)에서만 축약한다. "카드 1234"처럼 표기해 뒤 4자리만
// 봐도 "카드로 결제했다"는 맥락이 바로 드러나게 한다(점만 찍힌 표기는 식별이 어렵다는 피드백).
const toCompactCardNumber = (maskedCardNumber) => {
  if (!maskedCardNumber) return '-'
  return `카드 ${maskedCardNumber.slice(-4)}`
}

// GET /api/statements?startDate=&endDate= 목 구현
export const mockGetStatements = ({ startDate, endDate } = {}) => {
  const userId = getMockSessionUserId()
  if (!isMockOrRealSessionActive()) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const start = startDate ? new Date(startDate) : new Date(0)
  const end = endDate ? new Date(endDate) : new Date()
  end.setHours(23, 59, 59, 999) // endDate가 날짜만 왔을 때 그날 끝까지 포함

  const payments = readMockList(PAYMENTS_KEY).filter(
    (p) => p.userId === userId && p.status === 'APPROVED'
  )

  const byMonth = new Map()
  payments.forEach((p) => {
    const createdAt = new Date(p.createdAt)
    if (createdAt < start || createdAt > end) return
    const monthKey = toMonthKey(createdAt)
    const bucket = byMonth.get(monthKey) ?? { totalAmount: 0, paymentCount: 0 }
    bucket.totalAmount += p.amount
    bucket.paymentCount += 1
    byMonth.set(monthKey, bucket)
  })

  const statements = Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1)) // 최신 월 먼저
    .map(([monthKey, bucket]) => {
      const [year, month] = monthKey.split('-').map(Number)
      return {
        statementId: monthKey,
        periodStart: new Date(year, month - 1, 1).toISOString().slice(0, 10),
        periodEnd: new Date(year, month, 0).toISOString().slice(0, 10),
        totalAmount: bucket.totalAmount,
        paymentCount: bucket.paymentCount,
      }
    })

  return { data: statements }
}

// 월별 영수증 내용을 그린다. renderVectorPdf가 페이지 높이를 정하기 위해 이 함수를
// 두 번(측정 1회 + 실제 렌더 1회) 호출하므로 순수하게 그리기만 담당한다.
const drawStatementContent = (doc, autoTable, { monthKey, merchantName, periodStart, periodEnd, payments }) => {
  let y = drawHeader(doc, merchantName, `${monthKey} 영수증`)

  drawLabelValueRow(doc, y, '대상 기간', `${periodStart} ~ ${periodEnd}`)
  y += 5
  drawLabelValueRow(doc, y, '결제 건수', `${payments.length}건`)
  y += 5

  y += 1
  drawDashedDivider(doc, y)
  y += 6

  const sortedPayments = payments.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    head: [['날짜', '도서명', '결제수단', '금액']],
    body: sortedPayments.map((p) => [
      toDateOnly(new Date(p.createdAt)),
      p.bookSummary,
      p.paymentMethodLabel || toCompactCardNumber(getMockCardById(p.cardId)?.maskedCardNumber),
      formatWon(p.amount),
    ]),
    ...tableTheme,
    styles: { ...tableTheme.styles, fontSize: 7, cellPadding: 1.2 },
    // 4개 컬럼 모두 폭을 명시적으로 고정한다(합계 68mm = 페이지폭 80 - 좌우 마진 6*2).
    // 'auto'(기본값)로 두면 마스킹 카드번호처럼 긴 고정폭 문자열이 폭을 많이 가져가면서
    // 도서명 컬럼이 지나치게 좁아져 "아몬드"처럼 짧은 제목까지 세로로 줄바꿈되는 문제가
    // 있었다. 카드번호는 뒤 4자리만 표시(toCompactCardNumber)하고 표 전체 폰트도 살짝
    // 줄여(7pt) 날짜/카드번호/금액이 한 줄에 들어가게 하고, 남는 폭을 전부 도서명에 준다.
    columnStyles: {
      0: { halign: 'left', cellWidth: 17 },
      1: { halign: 'left', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 15 },
    },
  })
  y = doc.lastAutoTable.finalY + 6

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  drawSolidDivider(doc, y)
  y += 7
  drawTotalRow(doc, y, '총 결제금액', totalAmount)
  y += 9

  return drawThankYouFooter(doc, y)
}

// GET /api/statements/{statementId}/download 목 구현
export const mockDownloadStatement = async (statementId) => {
  const userId = getMockSessionUserId()
  if (!isMockOrRealSessionActive()) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const monthKey = String(statementId)
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) throw mockApiError('영수증을 찾을 수 없습니다.', 'STATEMENT_NOT_FOUND')

  let payments = []

  try {
    const res = await apiClient.get('/api/payments', { params: { yearMonth: monthKey } })
    const remotePayments = res.data ?? []
    payments = remotePayments
      .filter((p) => p.status === 'APPROVED')
      .map((p) => ({
        id: p.paymentId,
        orderId: p.orderId,
        amount: p.amount,
        merchantName: MERCHANT_NAME,
        bookSummary: p.orderTitle || '-',
        status: p.status,
        paymentMethod: p.paymentMethod,
        paymentMethodLabel: p.paymentMethod === 'KAKAOPAY' ? '카카오페이' : '카드',
        approvalNumber: p.approvalNumber,
        createdAt: p.approvedAt,
      }))
  } catch {
    payments = readMockList(PAYMENTS_KEY).filter((p) => {
      if (p.userId !== userId || p.status !== 'APPROVED') return false
      const dateStr = String(p.createdAt || '')
      return dateStr.startsWith(monthKey)
    })
  }

  if (payments.length === 0) {
    throw mockApiError('영수증을 찾을 수 없습니다.', 'STATEMENT_NOT_FOUND')
  }

  const periodStart = `${monthKey}-01`
  const periodEnd = `${monthKey}-31`

  const unmappedOrderIds = payments.filter((p) => !p.bookSummary || p.bookSummary === '-').map((p) => p.orderId)
  const ordersById = unmappedOrderIds.length > 0 ? await resolveOrdersForReceipts(unmappedOrderIds) : new Map()
  const paymentsWithBooks = payments.map((p) => ({
    ...p,
    bookSummary: p.bookSummary && p.bookSummary !== '-' ? p.bookSummary : summarizeOrderItems(ordersById.get(Number(p.orderId))),
  }))

  const downloadUrl = await renderVectorPdf((doc, autoTable) =>
    drawStatementContent(doc, autoTable, {
      monthKey,
      merchantName: payments[0]?.merchantName || MERCHANT_NAME,
      periodStart,
      periodEnd,
      payments: paymentsWithBooks,
    })
  )
  return { data: { downloadUrl } }
}
