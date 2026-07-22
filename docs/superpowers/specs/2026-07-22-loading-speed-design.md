# 로딩 속도 개선 — 설계

## 진단
- `npm run build` 결과 메인 청크가 933KB. 원인은 `jspdf`+`html2canvas` — 영수증/명세서
  PDF 생성(`mockPdf.js`의 `renderElementToPdfUrl`)에서만 쓰이는데, `Payments.jsx`/`Statements.jsx`가
  정적 import 체인으로 앱 진입 시 함께 로드되고 있었음.
- `<img>` 태그는 전체 코드베이스에 `ProductCard.jsx` 한 곳뿐.
- 폰트는 `index.html`에 이미 `preload` + `onload` 스타일시트 전환 패턴이 적용돼 있어 렌더 차단이
  없음 — 추가 조치 불필요.

## 변경 사항

### `src/api/mockPdf.js`
최상단 정적 import를 제거하고, 유일한 사용처인 `renderElementToPdfUrl` 내부에서
동적 `import()`로 교체. 이 함수만 고치면 `mockPayments.js`/`mockStatements.js`를
거쳐 페이지가 이 함수를 실제로 호출하는 시점(영수증 보기/명세서 다운로드 클릭)에만
두 라이브러리가 네트워크에서 로드된다.

### `src/components/ProductCard.jsx`
`<img>` 태그에 `loading="lazy"` 속성 추가.

## 범위 밖
- 폰트 로딩: 이미 최적화되어 있어 변경 없음
- `ProductDetail.jsx`: 애초에 `<img>`를 쓰지 않고 플레이스홀더만 렌더링하는 기존 상태 — 이번 요청은
  기존 이미지에 lazy 속성을 추가하는 것이지 새 이미지 렌더링을 추가하는 게 아니므로 건드리지 않음
