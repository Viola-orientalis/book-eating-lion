# 로딩 속도 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초기 로드에 불필요한 PDF 생성 라이브러리(jspdf, html2canvas)를 동적 import로 분리하고, 도서 이미지에 lazy loading을 적용해 초기 번들/로드 비용을 줄인다.

**Architecture:** `mockPdf.js`의 정적 import 2개를 함수 내부 동적 import로 교체 — 단일 진입점(`renderElementToPdfUrl`)만 고치면 전체 호출 체인에 자동 적용된다. `ProductCard.jsx`는 속성 하나만 추가.

**Tech Stack:** Vite 8 (동적 import를 자동으로 별도 청크로 분리). 자동화 테스트 프레임워크 없음 — `npm run build`로 청크 분리 확인, `npm run dev` + 브라우저로 실제 동작 확인.

## Global Constraints

- `backend/` 디렉토리는 수정하지 않는다.
- mock 파일에 mock 폴백을 새로 추가하지 않는다 (이번 변경은 기존 mock 함수의 import 방식만 바꿈, 로직은 그대로).
- 커밋은 이 기능 전체를 마친 뒤 한 번만 수행하고, 커밋 메시지는 실행 전에 사용자 확인을 받는다.

---

### Task 1: mockPdf.js — PDF 라이브러리 동적 import 전환

**Files:**
- Modify: `frontend/src/api/mockPdf.js`

**Interfaces:**
- `renderElementToPdfUrl(element)`의 시그니처와 반환값(Promise<string> — Blob URL)은 변경 없음. 호출부(`mockPayments.js`, `mockStatements.js`)는 수정 불필요.

- [ ] **Step 1: 정적 import를 동적 import로 교체**

현재:

```js
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
```

다음으로 교체:

```js
// 브라우저에서 렌더링한 오프스크린 요소를 캡처해 PDF Blob URL로 만드는 공용 헬퍼.
// (mockPayments.js의 결제 명세서, mockStatements.js의 기간별 명세서가 함께 사용한다)
// 텍스트 대신 이미지로 캡처하는 이유: jsPDF 기본 폰트(Helvetica 등)는 한글 글리프가 없어
// doc.text()로 직접 그리면 글자가 깨진다. html2canvas로 브라우저가 렌더링한 화면을
// 그대로 캡처해 이미지로 삽입하면 한글도 정상적으로 나온다.
// jspdf/html2canvas는 이 함수를 실제로 호출할 때만 필요하므로(영수증/명세서 다운로드
// 시점) 동적 import로 초기 번들에서 분리한다.
export const renderElementToPdfUrl = async (element) => {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

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
```

- [ ] **Step 2: 빌드로 청크 분리 확인**

Run: `npm run build`
Expected: 메인 청크가 이전(933KB)보다 크게 줄어들고, `jspdf`/`html2canvas`를 포함한 별도 청크(파일명에 `jspdf` 또는 `html2canvas` 관련 이름, 또는 dynamic import로 생성된 이름 없는 청크)가 새로 생김.

- [ ] **Step 3: 브라우저로 실제 동작 확인**

`npm run dev`로 로그인 후 `/payments`에서 "명세서" 버튼(영수증) 클릭, `/statements`에서 "다운로드" 버튼 클릭 시 이전과 동일하게 PDF가 새 탭으로 열리는지 확인. 네트워크 탭에서 버튼 클릭 시점에 jspdf/html2canvas 청크가 로드되는지 확인.

Expected: 기능 동작은 이전과 동일, 다만 해당 청크는 클릭 시점에 로드됨.

---

### Task 2: ProductCard.jsx — 이미지 lazy loading

**Files:**
- Modify: `frontend/src/components/ProductCard.jsx`

- [ ] **Step 1: `<img>`에 loading="lazy" 추가**

현재:

```jsx
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            style={outOfStock ? { opacity: 0.5 } : undefined}
          />
```

다음으로 교체:

```jsx
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover"
            style={outOfStock ? { opacity: 0.5 } : undefined}
          />
```

- [ ] **Step 2: 브라우저 확인**

`npm run dev`로 홈에서 개발자 도구 Elements 탭으로 카드 이미지에 `loading="lazy"` 속성이 붙어있는지 확인 (mock 데이터에는 `imageUrl`이 없어 실제 이미지가 안 뜰 수 있음 — 속성 존재 여부만 확인하면 충분).

Expected: `<img loading="lazy" ...>` 렌더링 확인.

---

### Task 3: 전체 확인 및 커밋

**Files:** 없음 (검증 + 커밋만)

- [ ] **Step 1: lint**

```bash
npm run lint
```

Expected: 새 에러 없음.

- [ ] **Step 2: 커밋 메시지 확인 요청 후 커밋**

```bash
git add frontend/src/api/mockPdf.js frontend/src/components/ProductCard.jsx docs/superpowers/specs/2026-07-22-loading-speed-design.md docs/superpowers/plans/2026-07-22-loading-speed.md
git commit -m "perf: PDF 라이브러리 동적 import 및 이미지 lazy loading 적용"
```
