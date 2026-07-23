# 로딩 스켈레톤 UI — 설계

## 배경
API 호출이 있는 페이지(ProductList, Cart, Payments, Statements)가 로딩 중일 때
"불러오는 중..." 텍스트만 보여주고 있다. 브랜드 톤(클레이 컬러, 세로 스트립 등)에
맞는 스켈레톤 UI로 교체해 로딩 체감 품질을 높인다.

## 컴포넌트

### `src/components/skeletons/BookCardSkeleton.jsx`
- `ProductCard`와 동일한 형태를 모사: `aspect-[3/4]` 이미지 블록 + 제목바 + 가격바
- 블록 색상은 `var(--color-line)` (기존 구분선 톤), `animate-pulse`로 깜박임
- 카드 라운드는 `ProductCard`와 동일하게 `rounded-lg`
- 북마크 태그/세로 스트립 등 장식 요소는 넣지 않음 (ProductCard 자체에도 없는 요소)

### `src/components/skeletons/ListSkeleton.jsx`
- Cart/Payments/Statements가 공통으로 쓰는 "테두리 있는 행" 레이아웃을 모사:
  좌측 제목바 + 부제바, 우측 액션 영역 자리
- `rows` prop (기본값 3)으로 반복 개수 조절
- 블록 색상 `var(--color-line)`, `animate-pulse`, 라운드는 기존 행과 동일하게 `rounded`

## 연결 지점
| 페이지 | 현재 | 변경 후 |
|---|---|---|
| `ProductList.jsx` | `loading`일 때 텍스트 | `BookCardSkeleton` × `PAGE_SIZE`(12)를 기존 그리드에 렌더 |
| `Cart.jsx` | `loading`일 때 텍스트 | `<ListSkeleton rows={3} />` |
| `Payments.jsx` | `loading`일 때 텍스트 | `<ListSkeleton rows={3} />` |
| `Statements.jsx` | `loading`일 때 텍스트 | `<ListSkeleton rows={3} />` |

## 범위 밖
- Checkout, Cards, ProductDetail 등 이번 요청에 명시되지 않은 페이지는 건드리지 않음
- `backend/`, mock 관련 파일은 수정하지 않음
