# 로딩 스켈레톤 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ProductList, Cart, Payments, Statements 페이지의 로딩 상태를 텍스트("불러오는 중...") 대신 브랜드 톤에 맞는 스켈레톤 UI로 교체한다.

**Architecture:** `src/components/skeletons/`에 두 개의 순수 프레젠테이션 컴포넌트(`BookCardSkeleton`, `ListSkeleton`)를 만들고, 각 페이지의 기존 `loading` 분기에서 텍스트 대신 이 컴포넌트를 렌더링하도록 교체한다. 새 상태나 로직은 추가하지 않는다 — 기존 `loading` state를 그대로 사용.

**Tech Stack:** React 19, Tailwind 4 (`animate-pulse` 유틸리티), 기존 CSS 커스텀 프로퍼티(`--color-line` 등). 이 프로젝트에는 자동화 테스트 프레임워크가 없음(package.json에 test 스크립트 없음, oxlint만 존재) — 따라서 이 플랜은 pytest 스타일 실패 테스트 대신 **`npm run dev` + 브라우저 육안 확인**을 검증 수단으로 사용한다.

## Global Constraints

- `backend/` 디렉토리는 절대 수정하지 않는다.
- `mock*.js` 파일에 mock 폴백을 새로 추가하지 않는다 (이번 작업은 mock 파일을 건드리지 않음).
- 디자인 토큰은 `src/index.css`에 정의된 CSS 커스텀 프로퍼티만 사용한다 (`var(--color-line)` 등). 새 색상 하드코딩 금지.
- 애니메이션은 Tailwind `animate-pulse` 사용 (커스텀 keyframe 추가 안 함).
- 커밋은 이 기능 전체를 마친 뒤 **한 번만** 수행하고, 커밋 메시지는 실행 전에 사용자 확인을 받는다 (개별 태스크마다 커밋하지 않음 — 사용자가 기능 단위 커밋을 요청함).

---

### Task 1: BookCardSkeleton 컴포넌트

**Files:**
- Create: `frontend/src/components/skeletons/BookCardSkeleton.jsx`

**Interfaces:**
- Consumes: 없음 (props 없는 순수 컴포넌트)
- Produces: `export default function BookCardSkeleton()` — `ProductList.jsx`가 `{Array.from({ length: n }).map(...)}` 패턴으로 반복 렌더링해서 사용

- [ ] **Step 1: 컴포넌트 작성**

`ProductCard.jsx`의 구조(`aspect-[3/4]` 이미지 블록 + `p-3` 안에 제목바 + 가격바)를 그대로 모사하되 실제 콘텐츠 대신 `var(--color-line)` 블록을 넣는다.

```jsx
export default function BookCardSkeleton() {
  return (
    <div
      className="relative block rounded-lg overflow-hidden border animate-pulse"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
    >
      <div className="aspect-[3/4]" style={{ background: 'var(--color-line)' }} />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '80%' }} />
        <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '40%' }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 단독 렌더 확인**

`npm run dev`로 dev 서버를 띄운 뒤, 브라우저 콘솔에서 임시로 `ProductList.jsx`에 `<BookCardSkeleton />` 한 줄을 추가해 화면에 카드 모양의 회색 블록이 `ProductCard`와 같은 비율로 나타나는지 확인한다. 확인 후 임시로 추가한 줄은 제거한다 (Task 3에서 정식으로 연결하므로).

Expected: `ProductCard`와 동일한 높이/비율의 카드가 은은하게 깜박이며(pulse) 렌더링됨.

---

### Task 2: ListSkeleton 컴포넌트

**Files:**
- Create: `frontend/src/components/skeletons/ListSkeleton.jsx`

**Interfaces:**
- Consumes: 없음
- Produces: `export default function ListSkeleton({ rows = 3 })` — `Cart.jsx`, `Payments.jsx`, `Statements.jsx`가 `<ListSkeleton rows={3} />` 형태로 사용

- [ ] **Step 1: 컴포넌트 작성**

Cart/Payments/Statements가 공통으로 쓰는 "테두리 있는 행" 레이아웃(`border rounded px-4 py-3 flex items-center justify-between`, 좌측 제목+부제, 우측 액션 영역)을 모사한다.

```jsx
export default function ListSkeleton({ rows = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="border rounded px-4 py-3 flex items-center justify-between animate-pulse"
          style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
        >
          <div className="flex flex-col gap-2">
            <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '160px' }} />
            <div className="h-3 rounded" style={{ background: 'var(--color-line)', width: '100px' }} />
          </div>
          <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '48px' }} />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 단독 렌더 확인**

Task 1과 같은 방식으로 `Cart.jsx`에 임시로 `<ListSkeleton rows={3} />`를 추가해 기존 장바구니 행과 비슷한 폭/높이의 회색 블록 3줄이 나타나는지 확인한다. 확인 후 임시 코드는 제거한다.

Expected: 기존 장바구니 아이템 행과 비슷한 테두리/패딩을 가진 3개의 깜박이는 행이 렌더링됨.

---

### Task 3: ProductList.jsx 연결

**Files:**
- Modify: `frontend/src/pages/ProductList.jsx`

**Interfaces:**
- Consumes: `BookCardSkeleton` (Task 1의 default export, props 없음)

- [ ] **Step 1: import 추가**

파일 상단에 추가:

```jsx
import BookCardSkeleton from '../components/skeletons/BookCardSkeleton'
```

- [ ] **Step 2: loading 분기 교체**

현재 코드:

```jsx
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>불러오는 중...</p>
      ) : visibleProducts.length === 0 ? (
```

다음으로 교체:

```jsx
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
```

- [ ] **Step 3: 브라우저 확인**

`npm run dev` 실행 후 홈(`/`)에 접속해 페이지 진입 시 잠깐이라도 12개의 카드 스켈레톤 그리드가 보였다가 실제 도서 목록으로 바뀌는지 확인한다. 페이지네이션 "다음" 버튼 클릭 시에도 동일하게 스켈레톤이 보이는지 확인한다 (매 페이지 전환마다 `loading`이 `true`가 되므로).

Expected: 로딩 중 카드 그리드 형태의 스켈레톤, 로딩 완료 시 실제 도서 카드로 자연스럽게 전환.

---

### Task 4: Cart.jsx 연결

**Files:**
- Modify: `frontend/src/pages/Cart.jsx`

**Interfaces:**
- Consumes: `ListSkeleton` (Task 2의 default export, `rows` prop)

- [ ] **Step 1: import 추가**

```jsx
import ListSkeleton from '../components/skeletons/ListSkeleton'
```

- [ ] **Step 2: loading 분기 교체**

현재 코드:

```jsx
  if (loading) {
    return <p className="text-sm">불러오는 중...</p>
  }
```

다음으로 교체:

```jsx
  if (loading) {
    return <ListSkeleton rows={3} />
  }
```

- [ ] **Step 3: 브라우저 확인**

로그인한 상태로 `/cart`에 접속해 로딩 스켈레톤이 보였다가 실제 장바구니 목록(또는 빈 상태)으로 전환되는지 확인한다.

Expected: 페이지 진입 시 3줄짜리 행 스켈레톤이 잠깐 보이고 실제 데이터로 전환.

---

### Task 5: Payments.jsx 연결

**Files:**
- Modify: `frontend/src/pages/Payments.jsx`

**Interfaces:**
- Consumes: `ListSkeleton` (Task 2의 default export, `rows` prop)

- [ ] **Step 1: import 추가**

```jsx
import ListSkeleton from '../components/skeletons/ListSkeleton'
```

- [ ] **Step 2: loading 분기 교체**

현재 코드:

```jsx
      {loading ? (
        <p className="text-sm">불러오는 중...</p>
      ) : payments.length === 0 ? (
```

다음으로 교체:

```jsx
      {loading ? (
        <ListSkeleton rows={3} />
      ) : payments.length === 0 ? (
```

- [ ] **Step 3: 브라우저 확인**

`/payments`에 접속해 스켈레톤 → 실제 결제내역(또는 빈 상태) 전환을 확인한다.

Expected: Task 4와 동일한 형태의 3줄 스켈레톤이 보인 뒤 전환.

---

### Task 6: Statements.jsx 연결

**Files:**
- Modify: `frontend/src/pages/Statements.jsx`

**Interfaces:**
- Consumes: `ListSkeleton` (Task 2의 default export, `rows` prop)

- [ ] **Step 1: import 추가**

```jsx
import ListSkeleton from '../components/skeletons/ListSkeleton'
```

- [ ] **Step 2: loading 분기 교체**

현재 코드:

```jsx
      {loading ? (
        <p className="text-sm">불러오는 중...</p>
      ) : statements.length === 0 ? (
```

다음으로 교체:

```jsx
      {loading ? (
        <ListSkeleton rows={3} />
      ) : statements.length === 0 ? (
```

- [ ] **Step 3: 브라우저 확인**

`/statements`에서 "조회" 버튼을 눌렀을 때도 스켈레톤이 보이는지 확인한다 (기존 버튼 안의 "조회 중..." 텍스트는 그대로 유지 — 폼 버튼은 이번 스코프 밖).

Expected: 최초 진입 시와 재조회 시 모두 3줄 스켈레톤 표시 후 전환.

---

### Task 7: 전체 확인 및 커밋

**Files:** 없음 (검증 + 커밋만)

- [ ] **Step 1: 전체 페이지 순회 확인**

`npm run dev`로 홈 → 장바구니 → 결제내역 → 명세서 순서로 이동하며 4개 페이지 모두 스켈레톤이 브랜드 톤(클레이 테두리 없음, `--color-line` 톤 블록, `paper-soft` 배경)에 맞게 자연스럽게 보이는지 최종 확인한다.

- [ ] **Step 2: lint 확인**

```bash
npm run lint
```

Expected: 에러 없음 (기존에 있던 에러는 이번 변경과 무관하면 무시).

- [ ] **Step 3: 커밋 메시지 확인 요청 후 커밋**

다음 커밋 메시지를 사용자에게 제시하고 승인받은 뒤 커밋한다:

```bash
git add frontend/src/components/skeletons/BookCardSkeleton.jsx frontend/src/components/skeletons/ListSkeleton.jsx frontend/src/pages/ProductList.jsx frontend/src/pages/Cart.jsx frontend/src/pages/Payments.jsx frontend/src/pages/Statements.jsx docs/superpowers/specs/2026-07-22-loading-skeletons-design.md docs/superpowers/plans/2026-07-22-loading-skeletons.md
git commit -m "feat: 로딩 스켈레톤 UI 추가"
```
