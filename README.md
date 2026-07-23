# Book Eating Lion (책 먹는 사자)

K8s 및 AWS EKS 기반 금융/결제 연동 도서 쇼핑몰 시스템

---

## 📁 폴더 구조

```text
book_eating_lion/
├── frontend/       # React 기반 UI (도서 목록, 장바구니, 결제 모달)
├── backend/        # Spring Boot API (도서, 주문, 결제, 가상카드, CQRS 라우팅)
├── k8s/            # Kubernetes 관련 매니페스트 통합 관리
│   ├── app/        # App, DB, Ingress, HPA 배포 매니페스트
│   └── monitoring/ # Prometheus & Grafana 모니터링 
├── db/             # DDL 및 초기화 SQL 스크립트 (1_demo_data.sql)
└── docs/           # 시스템 기획서, ERD, API 명세서, Postman 컬렉션
```

---

## 현재 구현된 핵심 기능 목록

1. **회원 인증 (Auth)**
   - 회원가입 (`POST /api/auth/signup`)
   - 로그인 (`POST /api/auth/login` -> JWT 토큰 발급)
   - 내 정보 조회 및 권한 확인 (`GET /api/auth/me`)

2. **도서 조회 (Books)**
   - 도서 목록 페이징 조회 및 카테고리/키워드 검색 (`GET /api/books`)
   - 도서 상세 정보 조회 (`GET /api/books/{bookId}`)

3. **장바구니 (Cart)**
   - 장바구니 담기, 조회, 수량 수정, 항목 삭제 (`/api/cart`)

4. **가상 카드 (Cards)**
   - 사용자 월 한도 지정 가상 카드 발급 (`POST /api/cards`)
   - 내 가상 카드 목록 조회 (`GET /api/cards`)

5. **주문 및 재고 트랜잭션 (Orders)**
   - 주문 생성 (`POST /api/orders`) -> 원자적 동시성 재고 차감 및 주문 상태 (`PENDING_PAYMENT`) 생성
   - 내 주문 내역 조회 (`GET /api/orders`)

6. **결제 및 승인/취소 (Payments & KakaoPay)**
   - **가상 카드 결제**: 멱등성 키 기반 중복 결제 방지, 카드 잔여 한도 원자적 차감 (`POST /api/payments/card`)
   - **카카오페이 결제**: 준비(`ready`) & 승인(`approve`) API 연동 (`POST /api/payments/kakaopay/*`)
   - **결제 취소**: 일반 카드 및 카카오페이 외부 취소 API 연동, 재고 자동 원상복구 (`POST /api/payments/{paymentId}/cancel`)

7. **CQRS 기반 Primary / Replica DB 동적 라우팅 (RoutingDataSource)**
   - Spring `AbstractRoutingDataSource` 및 `LazyConnectionDataSourceProxy` 기반 라우터 구현
   - `@Transactional(readOnly = true)` 어노테이션 진입 시 자동으로 **Replica(Read) DB** 연결
   - 그 외 CUD 트랜잭션 시 **Primary(Write) DB** 자동 라우팅

---

## Postman API 테스트 가이드

- **테스트 컬렉션 파일**: [docs/book_eating_lion_api.postman_collection.json]
- **API 테스트 결과 파일** : [docs/book_eating_lion_api_results.md]

---

## ⚙️ 환경 변수 관리

- **로컬 개발**: `application.yml` 템플릿 기본값(`localhost:3306`) 활용
- **운영 / AWS RDS 배포**: 아래 환경 변수를 주입하여 Primary / Replica DB 자동 연결
  - `DB_PRIMARY_HOST`: AWS RDS Writer 엔드포인트
  - `DB_REPLICA_HOST`: AWS RDS Reader 엔드포인트
  - `DB_USERNAME`, `DB_PASSWORD`: 데이터베이스 계정 정보

---

## 배포 및 실행 (Docker Compose)

```bash
# 컨테이너 및 볼륨 초기화 재기동
docker compose down -v && docker compose up --build -d
```
