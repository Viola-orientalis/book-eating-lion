import { formatDateTime } from '../utils/formatDate'
import {
  PDF_FONT,
  PDF_MARGIN,
  PDF_PAGE_WIDTH,
  COLOR_CLAY,
  formatWon,
  drawHeader,
  drawLabelValueRow,
  drawSolidDivider,
  drawDashedDivider,
  drawTotalRow,
  drawThankYouFooter,
  tableTheme,
  renderVectorPdf,
} from './receiptPdfKit'

// 결제 1건짜리 영수증 내용을 그린다. renderVectorPdf가 페이지 높이를 정하기 위해
// 이 함수를 두 번(측정 1회 + 실제 렌더 1회) 호출하므로 순수하게 그리기만 담당한다.
const drawReceiptContent = (doc, autoTable, values) => {
  const {
    merchantName,
    buyerName,
    paymentId,
    approvalNumber,
    createdAt,
    paymentMethod,
    maskedCardNumber,
    statusLabel,
    items,
    amount,
  } = values

  let y = drawHeader(doc, merchantName, '영수증')

  // paymentMethod: 'CARD' | 'KAKAOPAY'. maskedCardNumber는 로컬 mock 카드 저장소에서만
  // 조회 가능해서, 실백엔드에서 조회한 카드 결제는 결제수단은 알아도(paymentMethod) 마스킹
  // 번호까지는 복원이 안 될 수 있다 - 그 경우 "가상카드"까지만 표시한다.
  const maskedCardLabel = maskedCardNumber ? `가상카드 (**** ${maskedCardNumber.slice(-4)})` : '가상카드'
  const paymentMethodLabel =
    paymentMethod === 'KAKAOPAY'
      ? '카카오페이'
      : paymentMethod === 'CARD'
        ? maskedCardLabel
        : maskedCardNumber
          ? maskedCardLabel
          : '-'

  const infoRows = [
    ['발급일시', formatDateTime(createdAt)],
    ['승인번호', approvalNumber || '-'],
    ['결제수단', paymentMethodLabel],
    ['구매자', buyerName || '알 수 없음'],
    ['상태', statusLabel || '-'],
  ]
  infoRows.forEach(([label, value]) => {
    drawLabelValueRow(doc, y, label, value)
    y += 5
  })

  y += 1
  drawDashedDivider(doc, y)
  y += 6

  const lineItems = items ?? []
  if (lineItems.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: PDF_MARGIN, right: PDF_MARGIN },
      head: [['도서명', '수량', '단가', '금액']],
      body: lineItems.map((i) => [
        i.title,
        String(i.quantity),
        formatWon(i.price),
        formatWon(i.price * i.quantity),
      ]),
      ...tableTheme,
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center', cellWidth: 10 },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    })
    y = doc.lastAutoTable.finalY + 6
  } else {
    doc.setFont(PDF_FONT, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_CLAY)
    doc.text('구매 품목 정보를 불러올 수 없습니다', PDF_PAGE_WIDTH / 2, y, { align: 'center' })
    y += 8
  }

  if (lineItems.length > 0) {
    const subtotal = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    drawLabelValueRow(doc, y, '소계', formatWon(subtotal))
    y += 6
  }

  drawSolidDivider(doc, y)
  y += 7
  drawTotalRow(doc, y, '총 결제금액', amount)
  y += 9

  return drawThankYouFooter(doc, y, `결제번호 ${paymentId}`)
}

// payment/order/buyer/card 조회는 호출부(mockPayments.js)의 책임이고, 여기서는 이미
// 조합된 값만 받아서 그리기만 한다.
export const renderReceiptPdf = async (values) =>
  renderVectorPdf((doc, autoTable) => drawReceiptContent(doc, autoTable, values))
