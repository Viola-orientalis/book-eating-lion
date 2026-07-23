# 프로젝트 진행 현황 및 잔여 과제 (Project Status & TODO)

본 문서는 **Book Eating Lion (책 먹는 사자)** 프로젝트의 현재 구현 완료된 기능과 향후 구현/개선해야 할 과제를 정리한 현황표입니다.

---

## 1. 완료된 작업 (Completed Features)

### 🟢 DB & 인프라 (Database & Infrastructure)

- [x] **MySQL 8.0 DDL 스크립트 작성 (`db/0_schema.sql`)**: `Members`, `Cards`, `Books`, `Orders`, `Order_Items`, `Payments`, `Statements`, `Cart_Items` 8개 테이블 완성.
- [x] **한글 인코딩 및 데모 데이터 (`db/1_demo_data.sql`)**: `SET NAMES utf8mb4` 및 `--skip-character-set-client-handshake` 설정으로 한글 깨짐 완전 차단.
- [x] **Docker Compose 기반 로컬 가동 체계 구축**:
  - `MySQL 8.0` + `Spring Boot 4.0` + `React (Nginx 프록시)` 컨테이너 자동 헬스체크 및 의존 관계 설정 완료.
  - Nginx 프록시를 통한 동일 출처(Same-Origin) 처리로 **CORS 에러 100% 원천 차단**.

### 🟢 백엔드 (Spring Boot API)

- [x] **보안 및 인증 (Spring Security + JWT)**:
  - 비밀번호 BCrypt 암호화 저장 및 검증.
  - JWT 토큰 발급(Login) 및 요청 검증 필터(`JwtFilter`) 연동.
  - `GET /api/auth/me` 회원 정보 조회 구현.
- [x] **도서 목록 및 상세 조회 (`BookController`)**:
  - 페이징(`Pageable`), 카테고리 필터, 키워드 검색 기능 구현.
- [x] **장바구니 API (`CartController`)**:
  - 내 장바구니 조회 (`GET /api/cart`)
  - 장바구니 담기 (`POST /api/cart`)
  - 수량 변경 (`PUT /api/cart/{cartItemId}`)
  - 항목 삭제 (`DELETE /api/cart/{cartItemId}`)
- [x] **Swagger API 문서화 (Springdoc OpenAPI)**:
  - Swagger UI (`/swagger-ui/index.html`) 및 OpenAPI 3.0 스펙 (`/v3/api-docs`) 연동.
- [x] **공통 예외 처리 및 상태 검증 (GlobalExceptionHandler & HealthCheck)**:
  - `/health` 엔드포인트(HealthController) 추가 및 Security 설정 401 에러 해결.
  - 로그인 실패 시 401 대신 명확한 400 Bad Request 에러 반환 (GlobalExceptionHandler).

### 🟢 프론트엔드 (React + Vite)

- [x] **API 바인딩 및 프록시 환경 세팅**:
  - `VITE_API_BASE_URL=""` 설정으로 Docker Nginx 및 AWS CloudFront 동일 출처 호환 구조 확립.
- [x] **인증 연동 (Login / Signup / AuthContext)**:
  - 프론트-백엔드 DTO 필드명 매핑 (`loginId` -> `username`).
  - 로그인 성공 시 Header UI 즉시 로그인 상태로 변경.
- [x] **도서 목록 및 상세 페이지 실데이터 연동**:
  - DB의 실제 도서 목록("책 먹는 사자 (초급)" 등)을 화면에 정상 바인딩.
- [x] **장바구니 연동 (`Cart.jsx`)**:
  - 백엔드 `cartItemId`를 프론트엔드 `id`로 자동 매핑.
  - 백엔드 DB 장바구니에 실제 추가/수정/삭제 연동 완료.

---

## 2. 진행 예정 / 잔여 과제 (TODO & Remaining Tasks)

### 🟡 백엔드 (Backend Tasks)

- [ ] **주문(Order) API 구현**:
  - 장바구니 상품 기반 주문 생성 (`POST /api/orders`) 및 주문 내역 조회 (`GET /api/orders`)
- [ ] **결제(Payment) 및 가상 카드 연동 API**:
  - 결제 승인/취소 (`POST /api/payments`)
  - 가상 카드 등록/잔액 조회 (`GET /api/cards`)
- [ ] **월별 이용 명세서(Statement) 및 PDF 다운로드 API**:
  - 명세서 조회 및 S3/PDF 파일 다운로드 API 연동.

### 🟡 프론트엔드 (Frontend Tasks)

- [ ] **Mock 데이터 폴백(Fallback) 완전 제거**:
  - 주문(`orders.js`), 결제(`payments.js`), 명세서(`statements.js`) API 함수에 남아있는 `try-catch` 가짜 데이터 리턴 로직을 제거하고, 백엔드 API 연동으로 교체.
- [ ] **결제 모달 및 주문 페이지 실데이터 연동**:
  - `Checkout.jsx` 페이지에서 실제 결제 API 호출하도록 바인딩.
- [ ] **전역 에러 인터셉터 보강**:
  - `401 Unauthorized` 시 자동 로그아웃 및 로그인 페이지 리다이렉트 UI 안내 팝업 추가.

### 🔵 클라우드 & 배포 (Cloud & DevOps Tasks)

- [ ] **AWS S3 + CloudFront 정적 프론트엔드 배포**:
  - CloudFront 라우팅 규칙 설정 (`/api/*` -> 백엔드 ALB 로 전달).
- [ ] **AWS EKS 쿠버네티스 배포**:
  - `k8s/app/` 리소스 매니페스트 (Deployment, Service, Ingress, ConfigMap, Secret) 적용 및 검증.
- [x] **Postman Collection Export**:
  - API 테스트용 컬렉션 및 All-Pass 결과(`.postman_test_run.json`) 파일 추출 및 `docs` 폴더 저장 완료.

---

*최종 수정일: 2026-07-21*
