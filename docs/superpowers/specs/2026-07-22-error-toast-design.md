# 에러 토스트 — 설계

## 배경
당초 요청은 "프로젝트 전체의 `alert()`를 토스트로 교체"였으나, 코드베이스 전수 조사 결과
`alert()` 호출은 존재하지 않았다. 실제 문제는 두 가지였다:
1. 에러가 인라인 텍스트(Login/Signup/Checkout)로만 표시되고 나머지 페이지에서는 표시되지 않음
2. 백엔드 에러 응답 필드명이 `message`/`error`로 통일되어 있지 않아, 기존 `err.response?.data?.message`만
   확인하는 코드는 `IllegalArgumentException` 계열 에러(회원가입 아이디 중복, 로그인 실패 등)의
   실제 메시지를 한 번도 표시하지 못하고 있었음 (기존 버그)

사용자와 논의 후 "에러는 모두 토스트로 통일" + "Checkout의 지속성 메시지는 인라인 유지하며 토스트 병행"으로
범위를 확정했다.

## 에러 메시지 추출 규칙
`src/utils/errorMessage.js`:
```
getErrorMessage(err, fallback) = err.response?.data?.message ?? err.response?.data?.error ?? fallback
```
- `message` 우선 확인 (mock 에러, 401/403 응답에서 사람이 읽는 텍스트)
- 없으면 `error` 필드 (IllegalArgumentException 기반 검증 실패가 이 필드에 메시지를 담음)
- 둘 다 없으면 인자로 받은 기본 문구

## Toast 컴포넌트/컨텍스트
`src/context/ToastContext.jsx` — `AuthContext.jsx`와 동일한 구조:
- `ToastProvider`: `toasts` 배열 state, 4초 후 자동 제거, 여러 개면 스택
- `useToast()`: `{ showError }` 반환, Provider 밖에서 쓰면 에러 throw
- 렌더링: 화면 우상단 고정, `border-color: var(--color-danger)`, `background: var(--color-paper-soft)`,
  텍스트 `var(--color-ink)` — 기존 danger 컬러/paper-soft 배경 조합을 그대로 사용해 브랜드 톤 유지
- `main.jsx`에서 `<ToastProvider>`로 `<App />`을 감쌈 (`AuthProvider`와 나란히)

## 페이지별 변경

### Login.jsx / Signup.jsx
기존 `error` state와 인라인 `<p>` 에러 표시를 제거하고, catch 블록에서
`showError(getErrorMessage(err, '<기존 기본 문구>'))` 호출로 대체.

### Checkout.jsx
기존 `message` state/인라인 `<p>`(status=declined와 함께 지속 노출)는 그대로 유지.
`handleIssueCard`, `handlePay`의 catch 블록과 재고부족 declined 분기에서
같은 문구로 `showError`도 함께 호출 (인라인 + 토스트 병행).

### Cart.jsx
- 초기 목록 조회 `.catch(() => setItems([]))` → `showError` 추가 (기본 문구: "장바구니를 불러오지 못했습니다.")
- `handleQuantityChange`: catch 추가, `showError` (기본 문구: "수량 변경에 실패했습니다.")
- `handleRemove`: catch 추가, `showError` (기본 문구: "삭제에 실패했습니다.")

### Cards.jsx
- `loadCards` catch → `showError` 추가 (기본 문구: "카드 목록을 불러오지 못했습니다.")
- `handleIssue`: catch 추가, `showError` (기본 문구: "카드 발급에 실패했습니다.")

### Payments.jsx
- `load` catch → `showError` 추가 (기본 문구: "결제 내역을 불러오지 못했습니다.")
- `handleCancel`: catch 추가, `showError` (기본 문구: "결제 취소에 실패했습니다.")
- `handleReceipt`: catch 추가, `showError` (기본 문구: "영수증을 불러오지 못했습니다.")

### Statements.jsx
- `loadStatements` catch → `showError` 추가 (기본 문구: "명세서 목록을 불러오지 못했습니다.")
- `handleDownload`: catch 추가, `showError` (기본 문구: "명세서 다운로드에 실패했습니다.")

## 범위 밖
- `Payments.jsx`의 `confirm()`/`window.prompt()`는 에러 알림이 아닌 확인 다이얼로그이므로 건드리지 않음
- `backend/`, mock 파일 수정 없음 (에러 응답 형태는 읽기만 하고 그대로 소비)
