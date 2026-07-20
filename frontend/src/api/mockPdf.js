import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

// 브라우저에서 렌더링한 오프스크린 요소를 캡처해 PDF Blob URL로 만드는 공용 헬퍼.
// (mockPayments.js의 결제 명세서, mockStatements.js의 기간별 명세서가 함께 사용한다)
// 텍스트 대신 이미지로 캡처하는 이유: jsPDF 기본 폰트(Helvetica 등)는 한글 글리프가 없어
// doc.text()로 직접 그리면 글자가 깨진다. html2canvas로 브라우저가 렌더링한 화면을
// 그대로 캡처해 이미지로 삽입하면 한글도 정상적으로 나온다.
export const renderElementToPdfUrl = async (element) => {
  document.body.appendChild(element)
  try {
    // 붙인 직후에는 브라우저가 아직 레이아웃/페인트를 끝내지 않았을 수 있어 한 프레임 대기
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 })
    const imageData = canvas.toDataURL('image/png')

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 24
    const imageWidth = doc.internal.pageSize.getWidth() - margin * 2
    const imageHeight = (canvas.height / canvas.width) * imageWidth
    doc.addImage(imageData, 'PNG', margin, margin, imageWidth, imageHeight)

    const blob = doc.output('blob')
    return URL.createObjectURL(blob)
  } finally {
    document.body.removeChild(element)
  }
}

// 오프스크린 캡처용 컨테이너. opacity:0은 html2canvas가 투명하게(=백지로) 캡처하는
// 원인이 될 수 있어 쓰지 않고, 화면 밖(left:-99999px)으로만 밀어낸다. width/배경/글자색도
// 상속에 기대지 않고 인라인으로 명시한다.
export const createOffscreenContainer = (width = 600) => {
  const el = document.createElement('div')
  el.style.cssText =
    `position:fixed;top:0;left:-99999px;width:${width}px;padding:24px;background-color:#ffffff;color:#000000;font-family:sans-serif;font-size:12px;`
  return el
}

// 사용자 입력(이름 등)이 섞일 수 있는 값들이 있어 항상 textContent만 사용해 XSS를 방지한다.
export const appendTextLine = (parent, text, styleOverrides = '') => {
  const p = document.createElement('p')
  p.style.cssText = `margin:4px 0;${styleOverrides}`
  p.textContent = text
  parent.appendChild(p)
}
