// 영수증류 PDF(결제 1건 영수증 - mockPdf.js, 월별 영수증 - mockStatements.js)가 공유하는
// jsPDF 그리기 도구 모음. html2canvas로 DOM을 캡처하는 대신 jsPDF 도형/텍스트 API로 직접
// 그리므로 텍스트가 벡터라 확대해도 선명하고 PDF 안에서 텍스트 선택/검색도 된다.
// jsPDF 기본 폰트(Helvetica 등)엔 한글 글리프가 없어 Pretendard(OFL-1.1) TTF를 base64로
// 임베딩해 addFont로 등록한다. 폰트 파일이 커서(Regular+Bold 약 7MB) 실제로 PDF를 생성할
// 때만 동적 import되도록 분리했다(메인 번들에는 포함되지 않음).
export const PDF_FONT = 'Pretendard'
export const PDF_PAGE_WIDTH = 80 // mm, 감열지 영수증 폭
export const PDF_MARGIN = 6
export const COLOR_INK = [30, 42, 56] // --color-ink
export const COLOR_CLAY = [139, 90, 43] // --color-clay
export const COLOR_GOLD = [184, 134, 46] // --color-gold
export const COLOR_LINE = [221, 211, 188] // --color-line
export const COLOR_PAPER_SOFT = [251, 248, 241] // --color-paper-soft

export const formatWon = (amount) => `${Number(amount ?? 0).toLocaleString()}원`

export const registerPdfFonts = (doc, regularBase64, boldBase64) => {
  doc.addFileToVFS('Pretendard-Regular.ttf', regularBase64)
  doc.addFont('Pretendard-Regular.ttf', PDF_FONT, 'normal')
  doc.addFileToVFS('Pretendard-Bold.ttf', boldBase64)
  doc.addFont('Pretendard-Bold.ttf', PDF_FONT, 'bold')
}

export const drawSolidDivider = (doc, y) => {
  doc.setDrawColor(...COLOR_LINE)
  doc.setLineWidth(0.4)
  doc.setLineDashPattern([], 0)
  doc.line(PDF_MARGIN, y, PDF_PAGE_WIDTH - PDF_MARGIN, y)
}

export const drawDashedDivider = (doc, y) => {
  doc.setDrawColor(...COLOR_LINE)
  doc.setLineWidth(0.35)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(PDF_MARGIN, y, PDF_PAGE_WIDTH - PDF_MARGIN, y)
  doc.setLineDashPattern([], 0)
}

export const drawLabelValueRow = (doc, y, label, value) => {
  doc.setFont(PDF_FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_CLAY)
  doc.text(label, PDF_MARGIN, y)
  doc.setTextColor(...COLOR_INK)
  doc.text(String(value), PDF_PAGE_WIDTH - PDF_MARGIN, y, { align: 'right' })
}

// 좌: 라벨(굵게), 우: 크고 굵은 금액(gold) — "총 결제금액"처럼 강조가 필요한 줄에 쓴다.
export const drawTotalRow = (doc, y, label, amount) => {
  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLOR_INK)
  doc.text(label, PDF_MARGIN, y)
  doc.setFontSize(13)
  doc.setTextColor(...COLOR_GOLD)
  doc.text(formatWon(amount), PDF_PAGE_WIDTH - PDF_MARGIN, y, { align: 'right' })
}

// 상단 "로고(가맹점명) + 부제" 블록 + 실선 구분선. 결제 1건 영수증은 부제 "영수증",
// 월별 영수증은 "YYYY-MM 영수증"처럼 부제만 바뀐다. 다음 요소가 이어질 y를 반환한다.
export const drawHeader = (doc, merchantName, subtitle) => {
  let y = 12
  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLOR_INK)
  doc.text(merchantName || '책 먹는 사자', PDF_PAGE_WIDTH / 2, y, { align: 'center' })

  y += 6
  doc.setFont(PDF_FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_CLAY)
  doc.text(subtitle, PDF_PAGE_WIDTH / 2, y, { align: 'center' })

  y += 5
  drawSolidDivider(doc, y)
  return y + 6
}

// 점선 구분선 + 하단 감사 문구. extraLine이 있으면 한 줄 더 덧붙인다(예: 결제번호).
// 다음 요소(문서 끝)의 y를 반환한다.
export const drawThankYouFooter = (doc, y, extraLine) => {
  drawDashedDivider(doc, y)
  y += 6
  doc.setFont(PDF_FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_CLAY)
  doc.text('이용해주셔서 감사합니다', PDF_PAGE_WIDTH / 2, y, { align: 'center' })
  y += 4
  if (extraLine) {
    doc.text(extraLine, PDF_PAGE_WIDTH / 2, y, { align: 'center' })
    y += 4
  }
  return y + 4
}

// jsPDF/autotable 공통 표 스타일(헤더 배경색, 줄무늬 행) — 도서명 표(mockPdf.js)와
// 날짜/결제수단 표(mockStatements.js)가 동일한 톤을 쓰도록 공유한다.
export const tableTheme = {
  theme: 'striped',
  styles: {
    font: PDF_FONT,
    fontSize: 8,
    cellPadding: 1.6,
    textColor: COLOR_INK,
    lineColor: COLOR_LINE,
    lineWidth: 0.1,
  },
  headStyles: {
    fillColor: COLOR_CLAY,
    textColor: 255,
    fontStyle: 'bold',
    halign: 'center',
  },
  alternateRowStyles: {
    fillColor: COLOR_PAPER_SOFT,
  },
}

// jsPDF는 각 text()/line() 호출 시점의 "현재" 페이지 높이를 기준으로 좌표를 즉시 PDF
// 좌표계(하단 원점)로 확정해 그려 넣는다. 다 그린 뒤 페이지 높이만 줄이면 이미 그려진
// 내용이 전부 화면 밖으로 밀려나 안 보이게 되므로, 내용 길이에 맞는 정확한 페이지 높이를
// "미리" 알아내야 한다 — 넉넉한 높이(400mm)로 1차 측정 후, 측정된 높이로 2차 실제
// 렌더링한다(감열지 영수증처럼 내용 길이만큼만 페이지가 나오게 하기 위함).
// drawContent: (doc, autoTable) => finalY 형태의 콜백. 호출부가 실제 내용을 그린다.
export const renderVectorPdf = async (drawContent) => {
  const [{ jsPDF }, autoTableModule, { PRETENDARD_REGULAR_BASE64, PRETENDARD_BOLD_BASE64 }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('../assets/fonts/pretendardBase64.js'),
  ])
  const autoTable = autoTableModule.default

  const measureDoc = new jsPDF({ unit: 'mm', format: [PDF_PAGE_WIDTH, 400] })
  registerPdfFonts(measureDoc, PRETENDARD_REGULAR_BASE64, PRETENDARD_BOLD_BASE64)
  const contentHeight = drawContent(measureDoc, autoTable)

  const doc = new jsPDF({ unit: 'mm', format: [PDF_PAGE_WIDTH, contentHeight] })
  registerPdfFonts(doc, PRETENDARD_REGULAR_BASE64, PRETENDARD_BOLD_BASE64)
  drawContent(doc, autoTable)

  const blob = doc.output('blob')
  return URL.createObjectURL(blob)
}
