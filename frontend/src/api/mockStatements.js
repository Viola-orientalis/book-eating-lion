import { readMockList, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'
import { PAYMENTS_KEY, MERCHANT_NAME } from './mockPayments'
import { getMockCardById } from './mockCards'
import { createOffscreenContainer, appendTextLine, renderElementToPdfUrl } from './mockPdf'

// 결제 1건짜리 영수증(mockPayments.js)과 달리, "명세서"는 기간(월) 단위로 결제를
// 묶어서 만든다. 별도로 저장하지 않고 statementId(="YYYY-MM")로부터 그때그때 계산한다.
const toMonthKey = (date) => date.toISOString().slice(0, 7)

// GET /api/statements?startDate=&endDate= 목 구현
export const mockGetStatements = ({ startDate, endDate } = {}) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

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

const buildStatementElement = (monthKey, payments) => {
  const el = createOffscreenContainer(600)

  const title = document.createElement('h2')
  title.style.cssText = 'margin:0 0 16px;font-size:18px;'
  title.textContent = `${MERCHANT_NAME} ${monthKey} 명세서`
  el.appendChild(title)

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  appendTextLine(el, `대상 기간: ${monthKey}`)
  appendTextLine(el, `결제 건수: ${payments.length}건`)

  const table = document.createElement('table')
  table.style.cssText =
    'width:100%;border-collapse:collapse;margin-top:16px;border-top:1px solid #ccc;padding-top:8px;'
  payments
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((p) => {
      const row = document.createElement('tr')

      const dateCell = document.createElement('td')
      dateCell.style.padding = '4px 0'
      dateCell.textContent = new Date(p.createdAt).toLocaleDateString()
      row.appendChild(dateCell)

      const merchantCell = document.createElement('td')
      merchantCell.style.cssText = 'padding:4px 0;text-align:center;'
      merchantCell.textContent = p.merchantName
      row.appendChild(merchantCell)

      const cardCell = document.createElement('td')
      cardCell.style.cssText = 'padding:4px 0;text-align:center;'
      cardCell.textContent = getMockCardById(p.cardId)?.maskedCardNumber ?? '-'
      row.appendChild(cardCell)

      const amountCell = document.createElement('td')
      amountCell.style.cssText = 'padding:4px 0;text-align:right;'
      amountCell.textContent = `${p.amount.toLocaleString()}원`
      row.appendChild(amountCell)

      table.appendChild(row)
    })
  el.appendChild(table)

  const total = document.createElement('p')
  total.style.cssText = 'margin-top:16px;font-weight:bold;font-size:14px;'
  total.textContent = `총 결제금액: ${totalAmount.toLocaleString()}원`
  el.appendChild(total)

  return el
}

// GET /api/statements/{statementId}/download 목 구현
export const mockDownloadStatement = async (statementId) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const monthKey = String(statementId)
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) throw mockApiError('명세서를 찾을 수 없습니다.', 'STATEMENT_NOT_FOUND')

  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const payments = readMockList(PAYMENTS_KEY).filter((p) => {
    if (p.userId !== userId || p.status !== 'APPROVED') return false
    const createdAt = new Date(p.createdAt)
    return createdAt >= periodStart && createdAt <= periodEnd
  })
  if (payments.length === 0) {
    throw mockApiError('명세서를 찾을 수 없습니다.', 'STATEMENT_NOT_FOUND')
  }

  const element = buildStatementElement(monthKey, payments)
  const downloadUrl = await renderElementToPdfUrl(element)
  return { data: { downloadUrl } }
}
