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

* **로컬 개발**: `frontend/.env.example` 및 `backend/.../application.yml` 템플릿 참고 (`.env` 파일은 Git에서 제외)
* **AWS EKS 배포**: **ConfigMap 및 Secret** 자원 활용. DB 비밀번호나 API Key 등 민감 정보는 Secret 자원으로 생성 후 Pod 환경변수(env)로 주입하여 보안 관리.

## 배포 전략 (Deployment Strategy)

* **Docker Compose (로컬)**: Nginx가 프론트엔드를 서빙하며, `/api/*` 요청을 백엔드 컨테이너(`backend:8080`)로 프록시하여 CORS 방지.
    docker-compose down -v && docker-compose up -d --build   (- v :  볼륨 삭제)
    지금은 1_demo_data.sql을 넣는것으로 구동됨(빼고 싶으면 .bak 확장자 처리)

* **AWS S3 + CloudFront (운영)**:
  * `VITE_API_BASE_URL=""` (상대 경로)로 빌드하여 S3 정적 호스팅에 배포.
  * CloudFront 라우팅(Behavior) 설정: 기본 요청(`/*`)은 S3로, `/api/*` 요청은 백엔드(ALB / EC2 / API Gateway)로 전달하도록 설정하여 CORS 이슈 완전 차단.
