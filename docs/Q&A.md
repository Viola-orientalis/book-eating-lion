# 🦁 예상 Q&A (ERD / API / 설계 판단)

발표·코드리뷰 시 들어올 수 있는 질문과 답변을 정리한 개인 대비 문서.

---

## ERD 관련

### Q1. 장바구니를 왜 DB(Cart_Items)로 관리하나? 프론트(localStorage)로 하면 테이블 필요 없지 않나?

- **localStorage 방식**: JWT 인증 기반이면 로그인 유저별로 브라우저에 장바구니를 저장할 수 있음. DB 부하 없음.
- **DB 방식 선택 이유**:
  - 다른 기기/브라우저에서 로그인해도 장바구니가 유지됨 (크로스 디바이스).
  - 브라우저 캐시 삭제 시 장바구니 날아가는 문제 방지.
  - 재고 검증을 서버단에서 일관되게 처리 가능.
- **결론**: 학습 프로젝트이므로 DB 방식 채택. 실무에서는 둘 다 혼용(게스트는 localStorage, 로그인 유저는 DB 동기화)하는 경우가 많음.

### Q2. Members에 soft delete(is_deleted)를 쓰는데, 탈퇴한 유저의 login_id가 UNIQUE면 같은 아이디로 재가입 불가능한 거 아닌가?

- 맞음. soft delete 상태에서 동일 login_id 재가입 시 UNIQUE 제약 충돌 발생.
- 대응 방안:
  - 탈퇴 시 login_id를 `deleted_유저ID_원래아이디` 형태로 변경하여 UNIQUE 충돌 회피.
  - 또는 UNIQUE 제약을 `(login_id, is_deleted)` 복합 유니크로 변경.
- 현재 프로젝트에서는 탈퇴 후 동일 아이디 재가입 불허 정책으로 결정. 필요 시 위 방안 적용.

### Q3. Payments에서 card_id가 NULL 허용인 이유?

- 카카오페이 결제 시 가상 카드를 사용하지 않기 때문.
- `payment_method = 'KAKAOPAY'`일 때 card_id는 NULL, 대신 `pg_tid`(카카오 거래번호)로 결제를 추적함.

### Q4. Orders → Payments 관계가 1:1인데, 왜 별도 테이블로 분리했나?

- 주문과 결제는 생명주기가 다름. 주문 생성(PENDING_PAYMENT) 시점에는 아직 결제 레코드가 없음.
- 결제 실패/거절 시 Payments에 DECLINED 레코드가 쌓이고, 재시도 시 새 레코드 생성 → 실제로는 1:N 가능성 있음.
- 결제 수단별(CARD/KAKAOPAY) 고유 필드(card_id, pg_tid 등)를 주문 테이블에 섞으면 컬럼이 비대해짐.

### Q5. Order_Items에 unit_price를 따로 저장하는 이유? Books.price를 JOIN하면 되지 않나?

- 주문 후 도서 가격이 변경될 수 있음 (할인, 가격 인상 등).
- 주문 당시 가격을 스냅샷으로 저장해야 금액 정합성이 보장됨.
- JOIN으로 현재 가격을 쓰면 과거 주문 금액이 소급 변경되는 문제 발생.

### Q6. Cards에 card_token이 있는데 실제 카드번호는 어디 저장하나?

- **저장하지 않음**. 보안 요구사항에 따라 실제 카드번호, CVV, PIN은 DB에 저장 금지.
- card_token은 UUID 기반 식별자, masked_card_number는 표시용(`1234-****-****-5678`).
- 가상 카드이므로 실제 결제망 연동 없음. 토큰으로 내부 식별만 수행.

### Q7. Statements 테이블의 s3_object_key는 뭔가?

- S3에 저장된 명세서 파일의 경로(Key). 예: `statements/2026/07/member_1/statement_001.pdf`
- DB에는 파일 자체가 아닌 S3 경로만 저장. 다운로드 시 백엔드가 이 키로 S3 Pre-signed URL을 생성하여 반환.

---

## API 관련

### Q8. 프론트에서 보낸 주문 총액을 왜 서버에서 다시 계산하나?

- 프론트엔드 데이터는 조작 가능(DevTools, 프록시 등).
- 서버가 DB의 도서 가격 × 수량으로 직접 계산해야 금액 위변조를 방지할 수 있음.
- API 스펙상 주문 생성 시 `orderItems`(bookId, quantity)만 받고 금액은 받지 않는 이유.

### Q9. idempotencyKey(멱등성 키)가 뭐고 왜 필요한가?

- 네트워크 타임아웃 등으로 클라이언트가 같은 결제 요청을 중복 전송할 수 있음.
- idempotencyKey를 UNIQUE로 걸면 동일 키로 재요청 시 DB에서 중복 삽입이 차단됨.
- 첫 요청 결과를 캐싱하여 재요청 시 동일 응답을 반환하는 방식으로 중복 결제 방지.

### Q10. 카카오페이 결제 흐름이 2단계(ready → approve)인 이유?

- PG사 표준 결제 프로세스.
  1. **ready**: 서버가 카카오에 결제 정보 등록, 유저 인증용 리다이렉트 URL 수신.
  2. 유저가 카카오페이 앱에서 결제 승인.
  3. **approve**: 유저 승인 후 받은 pg_token으로 서버가 카카오에 최종 확정 요청.
- 유저의 명시적 동의 없이 서버 단독으로 결제를 확정할 수 없도록 하는 보안 구조.

### Q11. 결제 취소 시 CARD와 KAKAOPAY의 처리가 다른 이유?

- **CARD(가상카드)**: 내부 DB만 롤백(current_usage 복구, 재고 복구, 상태 변경).
- **KAKAOPAY**: 위 DB 롤백 + 카카오페이 취소 API 외부 호출 필요. 실제 결제가 카카오 측에서 승인되었으므로 망취소(카카오 서버에 취소 요청)를 해야 유저에게 환불됨.

### Q12. 왜 JWT를 선택했나? 세션 방식 대비 장점은?

- **JWT 선택 이유**:
  - Stateless: 서버에 세션 저장소 불필요. EC2 Scale-out 시 세션 동기화 문제 없음.
  - Docker 컨테이너 재시작 시에도 기존 토큰 유효.
- **단점(트레이드오프)**:
  - 토큰 탈취 시 서버에서 즉시 무효화 어려움 (블랙리스트 구현 필요).
  - 토큰 크기가 세션 ID보다 큼.
- 본 프로젝트는 단일 EC2이지만, 클라우드 환경 확장성을 고려해 JWT 채택.

---

## 설계 판단 관련

### Q13. 동시성 제어를 비관적 락(Pessimistic Lock)으로 한 이유?

- 재고와 카드 한도는 돈과 직결되는 리소스.
- 낙관적 락(Optimistic Lock)은 충돌 시 재시도 로직이 필요하고, 부하 테스트(k6)에서 대량 동시 요청 시 재시도 폭주(retry storm) 위험.
- 비관적 락(`SELECT ... FOR UPDATE`)은 순차 처리라 데드락만 주의하면 데이터 정합성 보장이 확실함.
- 데드락 대비: 락 획득 순서 통일(book_id 오름차순) + 타임아웃 설정 + "주문량이 많아 잠시 후 다시 시도해주세요" 에러 응답.

### Q14. S3 명세서를 건별(결제마다)이 아니라 월별 정산용으로 바꾼 이유?

- 건별 업로드: 결제 트랜잭션 내에서 S3 업로드 지연 발생 → 응답 속도 저하.
- 유저 입장의 개별 결제 내역은 DB 데이터 + 프론트 렌더링으로 실시간 제공 가능.
- S3는 장기 보관/아카이빙에 적합 → 관리자용 월별 정산 명세서(세금, 부가가치세 등)를 배치로 생성해 S3에 저장하는 것이 비용·성능 모두 합리적.

### Q15. Members 삭제 시 CASCADE로 Cards, Orders까지 다 삭제되면 주문 이력이 날아가는 거 아닌가?

- 맞음. 실무에서는 주문/결제 이력은 법적 보존 의무가 있어 CASCADE 삭제하면 안 됨.
- 본 프로젝트에서는 학습 목적으로 CASCADE 적용. 실무 적용 시 Orders/Payments는 `ON DELETE SET NULL` 또는 삭제 방지 정책으로 변경해야 함.
- soft delete 유예 기간(Lambda 삭제) 동안은 데이터가 보존되므로 즉시 삭제되지는 않음.

### Q16. 90일 후 Hard Delete를 Lambda로 하는 이유? Spring 스케줄러로도 되지 않나?

- **Spring 스케줄러도 가능**. 단, 서비스 서버에 삭제 부하가 실림.
- **Lambda 선택 이유**: 서비스 서버와 부하 분리, 다중 EC2 환경에서 중복 실행 방지 불필요, 클라우드 인프라 활용 포트폴리오로 적합.
- 트레이드오프: Lambda가 Private Subnet의 RDS에 접근하려면 VPC 연결 + NAT Gateway 또는 VPC Endpoint 설정 필요.

---

## DB 최적화 관련

### Q17. 복합 인덱스를 쓴 이유? 단일 컬럼 인덱스 여러 개면 안 되나?

- MySQL은 쿼리당 테이블에서 **인덱스 1개만 선택**함. 단일 인덱스 2개가 있어도 `WHERE A = ? AND B = ?` 조건에서 하나만 타고 나머지는 풀스캔.
- 복합 인덱스 `(A, B)`면 두 조건 모두 인덱스로 필터링 → I/O 대폭 감소.
- 프로젝트 내 적용 예시:
  - `Members(is_deleted, deleted_at)`: Lambda가 `WHERE is_deleted = 1 AND deleted_at < 90일전`으로 Hard Delete 대상 조회 시 복합 인덱스 한 번에 처리.
  - `Cards(is_deleted, deleted_at)`: 동일 패턴.
  - `Payments(card_id, approved_at)`: 특정 카드의 기간별 결제 내역 조회 시 `WHERE card_id = ? AND approved_at BETWEEN ? AND ?` → 복합 인덱스가 커버링 인덱스 역할.
  - `Statements(period_start, period_end)`: 기간 범위 검색에 최적화.
- **컬럼 순서가 중요**: 선택도(Cardinality)가 높은 컬럼 또는 등호(=) 조건 컬럼을 앞에, 범위(BETWEEN/>) 조건 컬럼을 뒤에 배치.

### Q18. 왜 금액 컬럼에 INT 대신 BIGINT을 썼나?

- **INT**: 최대 약 21억 (2,147,483,647). 원(₩) 단위로 약 21억 원까지.
- **BIGINT**: 최대 약 922경. 사실상 오버플로우 불가.
- 선택 근거:
  - 단일 도서 가격은 INT로 충분하지만, `total_amount`(주문 총액)나 `monthly_limit`(카드 한도)는 합산 값이므로 대량 주문 시 INT 범위 초과 가능성 있음.
  - 실무에서 금액 컬럼은 관례적으로 BIGINT 사용. INT→BIGINT 마이그레이션 비용(테이블 락) 대비 BIGINT의 추가 저장 비용(4바이트 차이)은 무시 가능.
  - **DECIMAL 안 쓴 이유**: 원화(₩)는 소수점 없음. 달러 등 소수점 통화 시 `DECIMAL(19,2)` 사용해야 하나, 본 프로젝트는 원화 전용이므로 정수형 BIGINT으로 충분.

### Q19. VARCHAR 길이를 50, 100, 255, 500 등으로 나눈 기준은?

- **MySQL InnoDB의 VARCHAR 저장 방식**: 실제 데이터 길이 + 1~2바이트 길이 프리픽스만 저장. `VARCHAR(50)`에 10글자 넣으면 10바이트+1만 사용.
- **그런데 왜 길이가 중요한가**:
  - **길이 프리픽스 경계**: VARCHAR(255) 이하는 길이 저장에 **1바이트**, VARCHAR(256) 이상은 **2바이트** 사용. 따라서 255가 자연스러운 경계선.
  - **메모리 버퍼(MEMORY/TempTable 엔진)**: `ORDER BY`, `GROUP BY`, `DISTINCT` 등에서 임시 테이블 생성 시 VARCHAR를 **선언된 최대 길이로 고정 할당**함. `VARCHAR(500)` 컬럼이 포함된 정렬은 행당 500바이트 메모리 소비.
  - **인덱스 키 길이 제한**: InnoDB 단일 인덱스 키 최대 3072바이트. VARCHAR가 크면 인덱스 생성 불가하거나 prefix index 필요.
- 프로젝트 적용 기준:

  | 길이 | 용도 | 근거 |
  |------|------|------|
  | VARCHAR(13) | ISBN | ISBN-13 국제 표준 고정 13자리 |
  | VARCHAR(19) | masked_card_number | `1234-****-****-5678` 포맷 고정 19자 |
  | VARCHAR(50) | login_id, approval_number | 사용자 입력 ID·승인번호. 50자면 충분하고 인덱스 효율 좋음 |
  | VARCHAR(100) | name, author, publisher | 한글 이름·저자명. 100자 내 |
  | VARCHAR(200) | title | 도서명. 부제 포함 시 길어질 수 있어 200 |
  | VARCHAR(255) | password, card_token | BCrypt 해시(60자)·UUID(36자)지만 향후 알고리즘 변경 대비 255. 1바이트 프리픽스 경계 최대값 |
  | VARCHAR(500) | image_url, s3_object_key, decline_reason | URL·파일 경로는 길어질 수 있음. 255 초과하므로 2바이트 프리픽스 사용하지만, URL 특성상 불가피 |

### Q20. 왜 price를 DECIMAL 안 쓰고 BIGINT 썼나? 소수점 계산 오류 안 나나?

- 원화(₩)는 최소 단위가 1원. 소수점 이하 금액이 존재하지 않음.
- BIGINT(정수) 연산은 DECIMAL 대비 비교·정렬·인덱스 성능이 빠름.
- 달러/유로 등 `$19.99` 같은 소수점 통화를 다룰 때만 `DECIMAL(19,2)` 필요.

### Q21. 현재 백엔드 서버는 어떤 구조(Architecture)인가요? 왜 이 구조를 채택했나요?

- **구조**: **Spring Boot 기반의 RESTful API 서버 (Stateless 구조)**
- **채택 이유**:
  - **관심사 분리**: 프론트엔드(React)와 백엔드를 완전히 분리(Decoupling)하여 각각 독립적인 배포와 기술 스택 선택이 가능하도록 하기 위함.
  - **플랫폼 확장성**: HTML이 아닌 JSON 기반으로 데이터를 주고받아, 추후 모바일 앱이나 외부 API 연동 등 다양한 클라이언트 확장에 유연하게 대응 가능.
  - **수평적 확장(Scale-out)**: 서버 측에 세션(Session) 상태를 저장하지 않는 무상태(Stateless) 구조(JWT 토큰 기반 인증)를 통해, 향후 쿠버네티스(k8s) 환경에서 트래픽 폭주 시 컨테이너(Pod) 인스턴스를 부담 없이 늘릴 수 있도록 설계.

### Q22. 인증(Authentication) 관련하여 겪었던 주요 트러블슈팅(Struggle) 경험은 무엇인가요?

- **문제 1: 예외 발생 시 무조건 401 Unauthorized로 덮어씌워지는 현상**
  - **증상**: 존재하지 않는 경로(`/health`)를 호출(404)하거나 로그인 시 비밀번호가 틀려도(IllegalArgumentException) 모두 무조건 401 에러가 반환됨.
  - **원인**: Spring Boot는 예외가 발생하면 내부적으로 `/error` 경로로 요청을 포워딩함. 그러나 `SecurityConfig`에 `/error` 경로를 예외 허용(`permitAll`) 처리하지 않아, 에러 응답을 내려주기도 전에 Spring Security 필터가 가로채서 401 인증 에러를 뱉어버린 것.
  - **해결**: Security 체인 설정에 `.requestMatchers("/health", "/error").permitAll()`을 명시적으로 추가하여 정상적인 에러 응답이 프론트엔드까지 도달하도록 해결.

- **문제 2: 비즈니스 예외에 대한 명확한 JSON 응답 부재**
  - **증상**: 위 1번 문제를 해결했음에도 로그인 실패 시 단순 500 에러 또는 빈 화면이 뜸. 
  - **원인**: 예외가 발생했을 때 이를 가로채서 API 형태에 맞는 깔끔한 JSON 에러 포맷으로 변환해주는 전역 에러 핸들러가 부재했음.
  - **해결**: `@RestControllerAdvice`를 활용한 `GlobalExceptionHandler`를 도입. 예외(`IllegalArgumentException`) 발생 시 400 Bad Request 상태 코드와 함께 `{"error": "아이디 또는 비밀번호가 일치하지 않습니다."}` 같은 명확한 메시지를 반환하여, 프론트엔드에서 즉시 알림창(Toast) 등을 띄울 수 있도록 개선.
