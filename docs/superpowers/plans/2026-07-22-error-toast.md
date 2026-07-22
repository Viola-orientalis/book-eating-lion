# 에러 토스트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 표시되지 않거나 인라인으로만 표시되는 API 에러를, 공용 토스트 컴포넌트로 통일해서 프로젝트 전체에서 일관되게 보여준다.

**Architecture:** `AuthContext.jsx`와 동일한 Context+Provider+훅 패턴으로 `ToastContext`를 만들고 `main.jsx`에서 전역으로 마운트한다. 에러 메시지 추출은 `src/utils/errorMessage.js`의 순수 함수 하나로 통일한다. 각 페이지는 catch 블록에서 `useToast().showError(getErrorMessage(err, fallback))`만 호출하면 된다.

**Tech Stack:** React 19 Context API, Tailwind 4. 자동화 테스트 프레임워크 없음 — 이 플랜은 `npm run dev` + 브라우저 확인을 검증 수단으로 사용한다.

## Global Constraints

- `backend/` 디렉토리는 수정하지 않는다.
- mock 파일에 새로운 mock 폴백을 추가하지 않는다.
- 디자인 토큰은 `src/index.css`의 CSS 커스텀 프로퍼티만 사용한다.
- `Payments.jsx`의 `confirm()`/`window.prompt()`는 건드리지 않는다 (에러 알림이 아닌 확인 다이얼로그).
- `Checkout.jsx`의 기존 인라인 `message`/`status` 표시는 제거하지 않고 유지한 채 토스트를 병행한다.
- 커밋은 이 기능 전체를 마친 뒤 한 번만 수행하고, 커밋 메시지는 실행 전에 사용자 확인을 받는다.

---

### Task 1: 에러 메시지 추출 유틸

**Files:**
- Create: `frontend/src/utils/errorMessage.js`

**Interfaces:**
- Produces: `export const getErrorMessage = (err, fallback) => string` — 이후 모든 태스크가 이 함수를 사용

- [ ] **Step 1: 유틸 작성**

```js
export const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.error || fallback
```

- [ ] **Step 2: 동작 확인**

새 파일이라 별도 실행 확인은 Task 4 이후 실제 페이지에서 함께 확인한다 (이 함수는 부수효과 없는 순수 함수).

---

### Task 2: ToastContext (Provider + 훅 + 렌더링)

**Files:**
- Create: `frontend/src/context/ToastContext.jsx`

**Interfaces:**
- Consumes: 없음
- Produces: `export function ToastProvider({ children })`, `export function useToast()` → `{ showError(message: string) }`

- [ ] **Step 1: 컴포넌트 작성**

`AuthContext.jsx`와 동일한 구조(createContext, Provider, 커스텀 훅에서 컨텍스트 밖 사용 시 에러)를 따른다. 토스트는 4초 후 자동 제거, 여러 개면 우상단에 세로로 쌓인다.

```jsx
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showError = useCallback((message) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = { showError }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className="rounded-lg border px-4 py-3 text-sm shadow-lg"
            style={{
              borderColor: 'var(--color-danger)',
              background: 'var(--color-paper-soft)',
              color: 'var(--color-ink)',
              boxShadow: '0 1px 2px rgba(30,42,56,0.06), 0 14px 28px -14px rgba(30,42,56,0.35)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast는 ToastProvider 내부에서만 사용 가능합니다')
  return ctx
}
```

- [ ] **Step 2: lint 확인**

Run: `npm run lint`
Expected: 새 파일에서 에러 없음.

---

### Task 3: main.jsx에 ToastProvider 연결

**Files:**
- Modify: `frontend/src/main.jsx`

**Interfaces:**
- Consumes: `ToastProvider` (Task 2)

- [ ] **Step 1: import 추가 및 Provider로 감싸기**

현재:

```jsx
import { AuthProvider } from './context/AuthContext'
import { installMockDevTools } from './api/mockDevTools'

if (import.meta.env.DEV) {
  installMockDevTools()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

다음으로 교체:

```jsx
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { installMockDevTools } from './api/mockDevTools'

if (import.meta.env.DEV) {
  installMockDevTools()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 2: dev 서버로 크래시 없는지 확인**

Run: `npm run dev` (이미 떠 있다면 HMR로 자동 반영)
Expected: 콘솔에 에러 없이 정상 렌더링.

---

### Task 4: Login.jsx / Signup.jsx — 인라인 에러를 토스트로 전환

**Files:**
- Modify: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/pages/Signup.jsx`

**Interfaces:**
- Consumes: `useToast` (Task 2), `getErrorMessage` (Task 1)

- [ ] **Step 1: Login.jsx 수정**

import 교체:

```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
```

컴포넌트 내부에서 `const { setUser } = useAuth()` 다음 줄에 추가:

```jsx
  const { showError } = useToast()
```

`const [error, setError] = useState('')` 줄은 삭제한다.

`handleSubmit`을 다음으로 교체:

```jsx
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(form)
      // 로그인 응답은 평탄한 형태: { accessToken, memberId, name, role }
      const { accessToken, ...member } = res.data
      localStorage.setItem('accessToken', accessToken)
      setUser(member)
      navigate('/')
    } catch (err) {
      showError(getErrorMessage(err, '아이디 또는 비밀번호를 확인해주세요.'))
    } finally {
      setLoading(false)
    }
  }
```

JSX에서 다음 블록을 삭제한다:

```jsx
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

```

- [ ] **Step 2: Signup.jsx 수정**

import에 추가:

```jsx
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
```

컴포넌트 내부, `const navigate = useNavigate()` 다음 줄에 추가:

```jsx
  const { showError } = useToast()
```

`const [error, setError] = useState('')` 줄은 삭제한다.

`handleSubmit`의 catch 블록을 다음으로 교체:

```jsx
    } catch (err) {
      showError(getErrorMessage(err, '회원가입에 실패했습니다.'))
    } finally {
```

(`setError('')`가 있던 `handleSubmit` 시작 부분의 줄도 삭제한다.)

JSX에서 다음 블록을 삭제한다:

```jsx
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

```

- [ ] **Step 3: 브라우저 확인**

`npm run dev`로 `/login`에서 잘못된 비밀번호로 로그인 시도 → 우상단에 "아이디 또는 비밀번호가 일치하지 않습니다." 토스트가 뜨는지 확인 (기존 버그였던 실제 백엔드 메시지가 이제 정상 노출되는지가 핵심 확인 포인트). `/signup`에서 이미 존재하는 아이디로 가입 시도 → "이미 존재하는 아이디입니다." 토스트 확인.

Expected: 두 페이지 모두 인라인 에러 텍스트 없이 토스트만 뜬다.

---

### Task 5: Checkout.jsx — 인라인 유지 + 토스트 병행

**Files:**
- Modify: `frontend/src/pages/Checkout.jsx`

**Interfaces:**
- Consumes: `useToast` (Task 2), `getErrorMessage` (Task 1)

- [ ] **Step 1: import 추가**

```jsx
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
```

- [ ] **Step 2: 컴포넌트 내부에 훅 추가**

`const navigate = useNavigate()` 다음 줄에:

```jsx
  const { showError } = useToast()
```

- [ ] **Step 3: handleIssueCard의 catch에 showError 추가**

현재:

```jsx
    } catch {
      setMessage('카드 발급에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
```

다음으로 교체:

```jsx
    } catch {
      const text = '카드 발급에 실패했습니다. 잠시 후 다시 시도해주세요.'
      setMessage(text)
      showError(text)
    } finally {
```

- [ ] **Step 4: 재고부족 declined 분기에 showError 추가**

현재:

```jsx
      if (staleItem) {
        setStatus('declined')
        setMessage(
          `${staleItem.title}은(는) 판매가 종료되어 결제를 진행할 수 없습니다. 장바구니에서 확인해주세요.`
        )
        return
      }
```

다음으로 교체:

```jsx
      if (staleItem) {
        const text = `${staleItem.title}은(는) 판매가 종료되어 결제를 진행할 수 없습니다. 장바구니에서 확인해주세요.`
        setStatus('declined')
        setMessage(text)
        showError(text)
        return
      }
```

- [ ] **Step 5: handlePay의 catch에 showError 추가**

현재:

```jsx
    } catch (err) {
      setStatus('declined')
      setMessage(err.response?.data?.message || '결제 처리 중 오류가 발생했습니다.')
    }
```

다음으로 교체:

```jsx
    } catch (err) {
      const text = getErrorMessage(err, '결제 처리 중 오류가 발생했습니다.')
      setStatus('declined')
      setMessage(text)
      showError(text)
    }
```

- [ ] **Step 6: 브라우저 확인**

`/checkout`에서 카드 발급 실패, 재고부족, 결제거절 세 경로 중 재현 가능한 것을 확인한다 (mock 환경에서는 카드 한도 초과 등으로 결제거절 유도 가능). 인라인 메시지와 토스트가 동시에 뜨고, 인라인 메시지는 계속 남아있는지 확인.

Expected: 토스트는 4초 후 사라지고, 인라인 메시지는 페이지에 남아있음.

---

### Task 6: Cart.jsx — 에러 핸들링 추가

**Files:**
- Modify: `frontend/src/pages/Cart.jsx`

**Interfaces:**
- Consumes: `useToast` (Task 2), `getErrorMessage` (Task 1)

- [ ] **Step 1: import 추가**

```jsx
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
```

- [ ] **Step 2: 컴포넌트 내부에 훅 추가**

`const navigate = useNavigate()` 다음 줄에:

```jsx
  const { showError } = useToast()
```

- [ ] **Step 3: 초기 목록 조회 catch 수정**

현재 (`useEffect` 안):

```jsx
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
```

다음으로 교체:

```jsx
      .catch((err) => {
        setItems([])
        showError(getErrorMessage(err, '장바구니를 불러오지 못했습니다.'))
      })
      .finally(() => setLoading(false))
```

- [ ] **Step 4: handleQuantityChange에 catch 추가**

현재:

```jsx
  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) return
    setBusyItemId(item.cartItemId)
    try {
      await updateCartItem(item.cartItemId, { quantity: nextQuantity })
      setItems((prev) =>
        prev.map((i) => (i.cartItemId === item.cartItemId ? { ...i, quantity: nextQuantity } : i))
      )
      notifyCartChanged()
    } finally {
      setBusyItemId(null)
    }
  }
```

다음으로 교체:

```jsx
  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) return
    setBusyItemId(item.cartItemId)
    try {
      await updateCartItem(item.cartItemId, { quantity: nextQuantity })
      setItems((prev) =>
        prev.map((i) => (i.cartItemId === item.cartItemId ? { ...i, quantity: nextQuantity } : i))
      )
      notifyCartChanged()
    } catch (err) {
      showError(getErrorMessage(err, '수량 변경에 실패했습니다.'))
    } finally {
      setBusyItemId(null)
    }
  }
```

- [ ] **Step 5: handleRemove에 catch 추가**

현재:

```jsx
  const handleRemove = async (item) => {
    setBusyItemId(item.cartItemId)
    try {
      await removeCartItem(item.cartItemId)
      setItems((prev) => prev.filter((i) => i.cartItemId !== item.cartItemId))
      notifyCartChanged()
    } finally {
      setBusyItemId(null)
    }
  }
```

다음으로 교체:

```jsx
  const handleRemove = async (item) => {
    setBusyItemId(item.cartItemId)
    try {
      await removeCartItem(item.cartItemId)
      setItems((prev) => prev.filter((i) => i.cartItemId !== item.cartItemId))
      notifyCartChanged()
    } catch (err) {
      showError(getErrorMessage(err, '삭제에 실패했습니다.'))
    } finally {
      setBusyItemId(null)
    }
  }
```

- [ ] **Step 6: 브라우저 확인**

`/cart`에서 수량 변경/삭제 버튼이 정상 동작하는지(에러가 없을 때 토스트가 뜨지 않아야 함) 확인. 강제로 에러를 재현하기 어렵다면 코드 리뷰로 catch 블록 로직만 확인해도 무방.

Expected: 정상 동작 시 토스트 없음, catch 블록 로직이 올바르게 작성됨.

---

### Task 7: Cards.jsx — 에러 핸들링 추가

**Files:**
- Modify: `frontend/src/pages/Cards.jsx`

**Interfaces:**
- Consumes: `useToast` (Task 2), `getErrorMessage` (Task 1)

- [ ] **Step 1: import 추가**

```jsx
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
```

- [ ] **Step 2: 컴포넌트 내부에 훅 추가**

`export default function Cards() {` 다음 줄에:

```jsx
  const { showError } = useToast()
```

- [ ] **Step 3: loadCards catch 수정**

현재:

```jsx
  const loadCards = () => {
    getMyCards()
      .then((res) => setCards(res.data))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }
```

다음으로 교체:

```jsx
  const loadCards = () => {
    getMyCards()
      .then((res) => setCards(res.data))
      .catch((err) => {
        setCards([])
        showError(getErrorMessage(err, '카드 목록을 불러오지 못했습니다.'))
      })
      .finally(() => setLoading(false))
  }
```

- [ ] **Step 4: handleIssue에 catch 추가**

현재:

```jsx
  const handleIssue = async (monthlyLimit) => {
    setIssuing(true)
    try {
      await issueCard({ monthlyLimit })
      setShowLimitForm(false)
      loadCards()
    } finally {
      setIssuing(false)
    }
  }
```

다음으로 교체:

```jsx
  const handleIssue = async (monthlyLimit) => {
    setIssuing(true)
    try {
      await issueCard({ monthlyLimit })
      setShowLimitForm(false)
      loadCards()
    } catch (err) {
      showError(getErrorMessage(err, '카드 발급에 실패했습니다.'))
    } finally {
      setIssuing(false)
    }
  }
```

- [ ] **Step 5: 브라우저 확인**

`/cards`에서 카드 목록 조회 및 카드 발급이 정상 동작하는지 확인.

Expected: 정상 동작 시 토스트 없음.

---

### Task 8: Payments.jsx — 에러 핸들링 추가

**Files:**
- Modify: `frontend/src/pages/Payments.jsx`

**Interfaces:**
- Consumes: `useToast` (Task 2), `getErrorMessage` (Task 1)

- [ ] **Step 1: import 추가**

```jsx
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
```

- [ ] **Step 2: 컴포넌트 내부에 훅 추가**

`export default function Payments() {` 다음 줄에:

```jsx
  const { showError } = useToast()
```

- [ ] **Step 3: load catch 수정**

현재:

```jsx
  const load = () => {
    getMyPayments()
      .then((res) => setPayments(res.data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }
```

다음으로 교체:

```jsx
  const load = () => {
    getMyPayments()
      .then((res) => setPayments(res.data))
      .catch((err) => {
        setPayments([])
        showError(getErrorMessage(err, '결제 내역을 불러오지 못했습니다.'))
      })
      .finally(() => setLoading(false))
  }
```

- [ ] **Step 4: handleCancel에 catch 추가**

현재:

```jsx
  const handleCancel = async (paymentId) => {
    if (!confirm('이 결제를 취소하시겠습니까?')) return
    const cancelReason = window.prompt('취소 사유를 입력하세요', '고객 변심') || '고객 변심'
    setCancellingId(paymentId)
    try {
      await cancelPayment(paymentId, cancelReason)
      load()
    } finally {
      setCancellingId(null)
    }
  }
```

다음으로 교체:

```jsx
  const handleCancel = async (paymentId) => {
    if (!confirm('이 결제를 취소하시겠습니까?')) return
    const cancelReason = window.prompt('취소 사유를 입력하세요', '고객 변심') || '고객 변심'
    setCancellingId(paymentId)
    try {
      await cancelPayment(paymentId, cancelReason)
      load()
    } catch (err) {
      showError(getErrorMessage(err, '결제 취소에 실패했습니다.'))
    } finally {
      setCancellingId(null)
    }
  }
```

- [ ] **Step 5: handleReceipt에 catch 추가**

현재:

```jsx
  const handleReceipt = async (paymentId) => {
    setReceiptLoadingId(paymentId)
    try {
      const res = await getPaymentReceipt(paymentId)
      window.open(res.data.url, '_blank')
    } finally {
      setReceiptLoadingId(null)
    }
  }
```

다음으로 교체:

```jsx
  const handleReceipt = async (paymentId) => {
    setReceiptLoadingId(paymentId)
    try {
      const res = await getPaymentReceipt(paymentId)
      window.open(res.data.url, '_blank')
    } catch (err) {
      showError(getErrorMessage(err, '영수증을 불러오지 못했습니다.'))
    } finally {
      setReceiptLoadingId(null)
    }
  }
```

- [ ] **Step 6: 브라우저 확인**

`/payments`에서 목록 조회, 영수증 보기, 취소가 정상 동작하는지 확인.

Expected: 정상 동작 시 토스트 없음.

---

### Task 9: Statements.jsx — 에러 핸들링 추가

**Files:**
- Modify: `frontend/src/pages/Statements.jsx`

**Interfaces:**
- Consumes: `useToast` (Task 2), `getErrorMessage` (Task 1)

- [ ] **Step 1: import 추가**

```jsx
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
```

- [ ] **Step 2: 컴포넌트 내부에 훅 추가**

`export default function Statements() {` 다음 줄에:

```jsx
  const { showError } = useToast()
```

- [ ] **Step 3: loadStatements catch 수정**

현재:

```jsx
  const loadStatements = () => {
    setLoading(true)
    getStatements(range)
      .then((res) => setStatements(res.data))
      .catch(() => setStatements([]))
      .finally(() => {
        setLoading(false)
        setSearched(true)
      })
  }
```

다음으로 교체:

```jsx
  const loadStatements = () => {
    setLoading(true)
    getStatements(range)
      .then((res) => setStatements(res.data))
      .catch((err) => {
        setStatements([])
        showError(getErrorMessage(err, '명세서 목록을 불러오지 못했습니다.'))
      })
      .finally(() => {
        setLoading(false)
        setSearched(true)
      })
  }
```

- [ ] **Step 4: handleDownload에 catch 추가**

현재:

```jsx
  const handleDownload = async (statementId) => {
    setDownloadingId(statementId)
    try {
      const res = await downloadStatement(statementId)
      window.open(res.data.downloadUrl, '_blank')
    } finally {
      setDownloadingId(null)
    }
  }
```

다음으로 교체:

```jsx
  const handleDownload = async (statementId) => {
    setDownloadingId(statementId)
    try {
      const res = await downloadStatement(statementId)
      window.open(res.data.downloadUrl, '_blank')
    } catch (err) {
      showError(getErrorMessage(err, '명세서 다운로드에 실패했습니다.'))
    } finally {
      setDownloadingId(null)
    }
  }
```

- [ ] **Step 5: 브라우저 확인**

`/statements`에서 조회, 다운로드가 정상 동작하는지 확인.

Expected: 정상 동작 시 토스트 없음.

---

### Task 10: 전체 확인 및 커밋

**Files:** 없음 (검증 + 커밋만)

- [ ] **Step 1: lint**

```bash
npm run lint
```

Expected: 이번 변경으로 인한 새 에러 없음.

- [ ] **Step 2: build**

```bash
npm run build
```

Expected: 빌드 성공.

- [ ] **Step 3: 전체 페이지 순회 확인**

Login → Signup → Cart → Cards → Payments → Statements → Checkout 순서로 이동하며 정상 동작 시 토스트가 뜨지 않는지, 위 각 태스크에서 확인한 에러 케이스가 재현 가능한 페이지는 다시 한번 확인한다.

- [ ] **Step 4: 커밋 메시지 확인 요청 후 커밋**

```bash
git add frontend/src/utils/errorMessage.js frontend/src/context/ToastContext.jsx frontend/src/main.jsx frontend/src/pages/Login.jsx frontend/src/pages/Signup.jsx frontend/src/pages/Checkout.jsx frontend/src/pages/Cart.jsx frontend/src/pages/Cards.jsx frontend/src/pages/Payments.jsx frontend/src/pages/Statements.jsx docs/superpowers/specs/2026-07-22-error-toast-design.md docs/superpowers/plans/2026-07-22-error-toast.md
git commit -m "feat: 에러 토스트 도입 및 전 페이지 에러 핸들링 통일"
```
