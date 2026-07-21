# 책 먹는 사자 - 백엔드 API 명세서

## 개발 우선순위

- **1차 구현 (핵심 기능)**: 회원 인증, 도서 조회, 장바구니, 가상 카드, 주문 트랜잭션, 결제(일반/카카오페이), 명세서 조회
- **차후 구현 (관리자 및 S3 연동)**: 관리자 도서 등록(S3 표지 이미지 업로드), 도서 수정 및 삭제

---

## 공통 사항

### 인증 규칙

- **비로그인 가능 (인증 헤더 불필요)**: 회원가입(`/api/auth/signup`), 로그인(`/api/auth/login`), 도서 조회(`/api/books`, `/api/books/{id}`)
- **로그인 필수 (인증 헤더 필요)**: 위 3개 제외한 나머지 모든 API (`Authorization: Bearer <token>` 헤더 필수)

### 공통 에러 응답 포맷

```json
{
  "errorCode": "ERROR_CODE_HERE",
  "message": "에러 메시지"
}
```

| HTTP 상태 | errorCode        | 설명                                       |
| --------- | ---------------- | ------------------------------------------ |
| `400`     | `BAD_REQUEST`    | 요청 파라미터 누락 또는 형식 오류          |
| `401`     | `UNAUTHORIZED`   | 토큰 없음 또는 만료                        |
| `403`     | `FORBIDDEN`      | 권한 없음 (일반 유저가 관리자 API 호출 등) |
| `404`     | `NOT_FOUND`      | 요청한 리소스 없음 (도서, 주문 등)         |
| `409`     | `CONFLICT`       | 중복 요청 또는 재고 부족 등 비즈니스 충돌  |
| `500`     | `INTERNAL_ERROR` | 서버 내부 오류                             |

---

## [1차 구현] 핵심 기능

## 1. 회원 및 인증 (Auth)

### 1.1 회원가입

- **Method**: `POST`
- **URL**: `/api/auth/signup`
- **Request Body**:

  ```json
  {
    "username": "user123",
    "password": "password123!",
    "name": "홍길동"
  }
  ```

- **Response**: `201 Created`

  ```json
  {
    "message": "회원가입이 완료되었습니다.",
    "memberId": 1
  }
  ```

### 1.2 로그인

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Request Body**:

  ```json
  {
    "username": "user123",
    "password": "password123!"
  }
  ```

- **Response**: `200 OK` (JWT 발급 - 이후 API 요청 시 `Authorization: Bearer <token>` 헤더 사용)

  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
    "memberId": 1,
    "name": "홍길동",
    "role": "USER"
  }
  ```

### 1.3 내 정보 조회 (Profile)

- **Method**: `GET`
- **URL**: `/api/auth/me`
- **설명**: 프론트엔드는 이 API를 호출해 받은 `role` 값에 따라 마이페이지 렌더링을 분기합니다. (`USER`면 주문/결제 내역 노출, `ADMIN`이면 도서 관리 및 전체 주문 조회 탭 추가 렌더링)
- **Response**: `200 OK`

  ```json
  {
    "memberId": 1,
    "username": "user123",
    "name": "홍길동",
    "role": "USER",
    "createdAt": "2026-07-20T10:00:00Z"
  }
  ```

### 1.4 회원 탈퇴

- **Method**: `DELETE`
- **URL**: `/api/auth/me`
- **Response**: `200 OK`

  ```json
  {
    "message": "회원 탈퇴 처리가 완료되었습니다. (90일 후 영구 삭제)"
  }
  ```

---

## 2. 도서 조회 (Books)

### 2.1 도서 목록 조회

- **Method**: `GET`
- **URL**: `/api/books`
- **Query Params**: `?keyword=검색어&category=소설&page=1&size=10`
- **Response**: `200 OK`

  ```json
  {
    "content": [
      {
        "bookId": 1,
        "title": "책 먹는 사자",
        "author": "라이언",
        "price": 15000,
        "stock": 100,
        "imageUrl": "https://s3.../image.jpg"
      }
    ],
    "pageInfo": {
      "currentPage": 1,
      "pageSize": 10,
      "totalElements": 45,
      "totalPages": 5
    }
  }
  ```

### 2.2 도서 상세 조회

- **Method**: `GET`
- **URL**: `/api/books/{bookId}`
- **Response**: `200 OK`

  ```json
  {
    "bookId": 1,
    "title": "책 먹는 사자",
    "author": "라이언",
    "publisher": "클라우드북스",
    "isbn": "9781234567890",
    "price": 15000,
    "stock": 100,
    "category": "IT",
    "description": "클라우드 엔지니어링 입문서",
    "imageUrl": "https://s3.../image.jpg",
    "saleStatus": "ON_SALE"
  }
  ```

---

## 3. 장바구니 (Cart)

### 3.1 내 장바구니 목록 조회

- **Method**: `GET`
- **URL**: `/api/cart`
- **Response**: `200 OK`

  ```json
  [
    {
      "cartItemId": 1,
      "bookId": 1,
      "title": "책 먹는 사자",
      "price": 15000,
      "quantity": 2,
      "totalItemPrice": 30000,
      "imageUrl": "https://s3.../image.jpg"
    }
  ]
  ```

### 3.2 장바구니 품목 추가

- **Method**: `POST`
- **URL**: `/api/cart`
- **Request Body**:

  ```json
  {
    "bookId": 1,
    "quantity": 1
  }
  ```

- **Response**: `201 Created`

  ```json
  {
    "cartItemId": 1,
    "message": "장바구니에 담겼습니다."
  }
  ```

### 3.3 장바구니 수량 변경

- **Method**: `PUT`
- **URL**: `/api/cart/{cartItemId}`
- **Request Body**:

  ```json
  {
    "quantity": 3
  }
  ```

- **Response**: `200 OK`

  ```json
  {
    "message": "수량이 변경되었습니다."
  }
  ```

### 3.4 장바구니 품목 삭제

- **Method**: `DELETE`
- **URL**: `/api/cart/{cartItemId}`
- **Response**: `200 OK`

  ```json
  {
    "message": "장바구니에서 삭제되었습니다."
  }
  ```

---

## 4. 가상 카드 (Cards)

### 4.1 가상 카드 발급

- **Method**: `POST`
- **URL**: `/api/cards`
- **Request Body**:

  ```json
  {
    "monthlyLimit": 1000000
  }
  ```

- **Response**: `201 Created`

  ```json
  {
    "cardId": 5,
    "maskedCardNumber": "1234-****-****-5678",
    "monthlyLimit": 1000000,
    "status": "ACTIVE"
  }
  ```

### 4.2 내 가상 카드 조회

- **Method**: `GET`
- **URL**: `/api/cards`
- **Response**: `200 OK`

  ```json
  [
    {
      "cardId": 5,
      "maskedCardNumber": "1234-****-****-5678",
      "monthlyLimit": 1000000,
      "currentUsage": 15000,
      "cardStatus": "ACTIVE"
    }
  ]
  ```

---

## 5. 주문 (Orders)

### 5.1 주문 생성

- **Method**: `POST`
- **URL**: `/api/orders`
- **Request Body**:

  ```json
  {
    "orderItems": [
      { "bookId": 1, "quantity": 2 },
      { "bookId": 3, "quantity": 1 }
    ]
  }
  ```

- **Response**: `201 Created`

  ```json
  {
    "orderId": 1001,
    "totalAmount": 60000,
    "orderStatus": "PENDING_PAYMENT"
  }
  ```

### 5.2 주문 내역 조회

- **Method**: `GET`
- **URL**: `/api/orders`
- **Response**: `200 OK`

  ```json
  [
    {
      "orderId": 1001,
      "totalAmount": 60000,
      "orderStatus": "PAID",
      "createdAt": "2026-07-20T10:05:00Z",
      "orderItems": [
        { "title": "책 먹는 사자", "quantity": 2, "price": 30000 },
        { "title": "클라우드 엔지니어링", "quantity": 1, "price": 30000 }
      ]
    }
  ]
  ```

---

## 6. 결제 (Payments)

### 6.1 결제 내역 조회

- **Method**: `GET`
- **URL**: `/api/payments`
- **Response**: `200 OK`

  ```json
  [
    {
      "paymentId": 501,
      "orderId": 1001,
      "paymentMethod": "CARD",
      "amount": 60000,
      "status": "APPROVED",
      "approvedAt": "2026-07-20T10:10:00Z"
    }
  ]
  ```

### 6.2 일반(가상) 카드 결제 요청

- **Method**: `POST`
- **URL**: `/api/payments/card`
- **Request Body**:

  ```json
  {
    "orderId": 1001,
    "cardId": 5,
    "idempotencyKey": "uuid-for-retry"
  }
  ```

- **Response (성공)**: `200 OK`

  ```json
  {
    "paymentId": 501,
    "approvalNumber": "APP123456",
    "status": "APPROVED",
    "amount": 60000
  }
  ```

- **Response (실패)**: `400 Bad Request`

  ```json
  {
    "errorCode": "INSUFFICIENT_LIMIT",
    "message": "카드 잔여 한도가 부족합니다."
  }
  ```

### 6.3 카카오페이 결제 준비 (Ready)

- **Method**: `POST`
- **URL**: `/api/payments/kakaopay/ready`
- **Request Body**:

  ```json
  {
    "orderId": 1001
  }
  ```

- **Response**: `200 OK`

  ```json
  {
    "tid": "T1234567890",
    "nextRedirectPcUrl": "https://online-pay.kakao.com/mockup/...",
    "nextRedirectMobileUrl": "https://m.online-pay.kakao.com/mockup/..."
  }
  ```

> **카카오페이 결제 흐름 요약 (프론트/백엔드 연동)**
>
> 1. **[프론트]** 백엔드 `/ready` API 호출
> 2. **[백엔드]** 카카오 서버 호출 후 결제 고유번호(`tid`)와 리다이렉트 URL 받아옴
> 3. **[프론트]** 전달받은 리다이렉트 URL(`nextRedirectPcUrl`)로 유저 화면 이동 (QR코드 노출)
> 4. **[유저]** 폰으로 QR 찍고 카카오페이 결제 승인 진행
> 5. **[카카오]** 설정해둔 **성공 콜백 URL**로 유저 리다이렉트 (이때 URL 뒤에 `?pg_token=어쩌구` 토큰값 붙어서 옴)
> 6. **[프론트]** URL 파라미터에서 `pg_token` 추출해서 백엔드 `/approve` API로 전송
> 7. **[백엔드]** 카카오 서버에 `pg_token` + `tid` 보내서 **최종 결제 확정**. 끝.

### 6.4 카카오페이 결제 승인 (Approve)

- **Method**: `POST`
- **URL**: `/api/payments/kakaopay/approve`
- **설명**: 프론트엔드가 콜백 URL에서 추출한 `pg_token`을 백엔드로 보내 최종 결제를 확정합니다.
- **Request Body**:

  ```json
  {
    "orderId": 1001,
    "tid": "T1234567890",
    "pgToken": "kakao_pg_token_value_from_url"
  }
  ```

- **Response**: `200 OK`

  ```json
  {
    "paymentId": 502,
    "approvalNumber": "KAKAO9876",
    "status": "APPROVED",
    "amount": 60000
  }
  ```

### 6.5 결제 취소

- **Method**: `POST`
- **URL**: `/api/payments/{paymentId}/cancel`
- **설명**: `CARD` 결제의 경우 내부 DB 취소 처리만 진행하나, `KAKAOPAY` 결제의 경우 백엔드에서 **카카오페이 취소 API**(`https://kapi.kakao.com/v1/payment/cancel`)를 연동 호출하여 실제 승인 취소(망취소)를 수행한 후 DB 상태를 변경합니다.
- **Request Body**:

  ```json
  {
    "cancelReason": "고객 변심"
  }
  ```

- **Response**: `200 OK`

  ```json
  {
    "message": "결제가 성공적으로 취소되었습니다.",
    "paymentStatus": "CANCELLED"
  }
  ```

---

## 7. 명세서 (Statements)

### 7.1 명세서 목록 조회

- **Method**: `GET`
- **URL**: `/api/statements`
- **Query Params**: `?startDate=2026-07-01&endDate=2026-07-31`
- **Response**: `200 OK`

  ```json
  [
    {
      "statementId": 1,
      "periodStart": "2026-07-01",
      "periodEnd": "2026-07-31",
      "totalAmount": 150000,
      "createdAt": "2026-08-01T10:00:00Z"
    }
  ]
  ```

### 7.2 명세서 다운로드 (S3 URL 반환)

**Method**: `GET`

- **URL**: `/api/statements/{statementId}/download`
- **Response**: `200 OK`

  ```json
  {
    "statementId": 1,
    "downloadUrl": "https://s3.ap-northeast-2.amazonaws.com/mybucket/statements/1.pdf"
  }
  ```

---

## [차후 구현] 관리자 및 S3 연동

## A.1 도서 등록 (관리자용)

- **Method**: `POST`
- **URL**: `/api/admin/books`
- **Request Type**: `multipart/form-data`
  - `bookData`: JSON (도서 메타데이터)
  - `coverImage`: File (.jpg, .png) -> **AWS S3에 업로드**
- **Response**: `201 Created`

  ```json
  {
    "bookId": 2,
    "message": "도서가 등록되었습니다.",
    "s3ImageUrl": "https://s3.ap-northeast-2.amazonaws.com/mybucket/books/image.jpg"
  }
  ```

> 💡 **S3 연동 방식:**
> 프론트엔드에서 전송한 이미지 파일을 백엔드가 받아 AWS S3 버킷에 업로드합니다.
> 업로드가 완료되면 S3가 반환한 객체 고유 URL(`s3ImageUrl`)을 DB의 `Books.image_url` 컬럼에 텍스트로 저장합니다. 조회 시 프론트엔드는 DB에 저장된 이 URL을 사용해 S3에서 직접 이미지를 불러옵니다.

## A.2 도서 수정 (관리자용)

- **Method**: `PUT`
- **URL**: `/api/admin/books/{bookId}`
- **Request Body**: JSON
- **Response**: `200 OK`

  ```json
  {
    "message": "도서 정보가 수정되었습니다."
  }
  ```

## A.3 도서 판매 중지 (관리자용)

- **Method**: `DELETE`
- **URL**: `/api/admin/books/{bookId}`
- **Response**: `200 OK`

  ```json
  {
    "message": "도서 판매가 중지되었습니다."
  }
  ```

## A.4 전체 유저 주문 조회 (관리자용)

- **Method**: `GET`
- **URL**: `/api/admin/orders`
- **Query Params**: `?page=1&size=10&status=PAID`
- **Response**: `200 OK`

  ```json
  {
    "content": [
      {
        "orderId": 1001,
        "memberId": 5,
        "username": "user123",
        "totalAmount": 60000,
        "orderStatus": "PAID",
        "createdAt": "2026-07-20T10:05:00Z"
      }
    ],
    "pageInfo": {
      "currentPage": 1,
      "pageSize": 10,
      "totalElements": 150,
      "totalPages": 15
    }
  }
  ```
