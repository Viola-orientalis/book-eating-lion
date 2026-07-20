# Book Eating Lion (책 먹는 사자)

K8s 및 AWS EKS 기반 금융/결제 연동 도서 쇼핑몰 시스템

## 폴더 구조

```text
book_eating_lion/
├── frontend/       # React 기반 UI (로컬스토리지 장바구니, 결제 모달)
├── backend/        # Spring Boot API (도서, 주문, 결제, 가상카드)
├── k8s/            # Kubernetes 관련 매니페스트 통합 관리
│   ├── app/        # App, DB, Ingress, HPA 배포 매니페스트
│   └── monitoring/ # Prometheus & Grafana 모니터링 
├── db/             # DDL 및 초기화 SQL 스크립트
└── docs/           # 시스템 기획서, ERD, 다이어그램
```

## 환경 변수 관리 (Environment Variables)

* **로컬 개발**: `frontend/.env.example` 및 `backend/.../application.yml` 템플릿 참고 (`.env` 파일은 Git에서 제외)
* **AWS EKS 배포**: **ConfigMap 및 Secret** 자원 활용. DB 비밀번호나 API Key 등 민감 정보는 Secret 자원으로 생성 후 Pod 환경변수(env)로 주입하여 보안 관리.
