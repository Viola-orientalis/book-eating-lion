-- 데모 및 테스트용 초기 더미 데이터 (demo_data.sql)

-- 1. 테스트 유저 생성 (비밀번호는 편의상 1234를 BCrypt로 암호화한 값이라 가정하거나 평문 테스트 시 수정 필요)
INSERT INTO Members (username, password, name, role) 
VALUES ('testuser', '$2a$10$X.X/w9lD1g...', '테스트유저', 'USER');

-- 2. 테스트 가맹점 유저 생성
INSERT INTO Members (username, password, name, role) 
VALUES ('merchant01', '$2a$10$X.X/w9lD1g...', '교보문고', 'MERCHANT');

-- 3. 가맹점 정보 생성
INSERT INTO Merchants (member_id, merchant_name)
VALUES (2, '사자 서점 본점');

-- 4. 도서 더미 데이터 생성 (S3 URL은 임시 플레이스홀더 사용)
INSERT INTO Books (title, author, publisher, isbn, price, stock, category, description, image_url, sale_status) VALUES
('책 먹는 사자 (초급)', '라이언', '클라우드북스', '9781234567890', 15000, 100, 'IT/프로그래밍', '초보자를 위한 클라우드 엔지니어링 입문서', 'https://s3.ap-northeast-2.amazonaws.com/mybucket/books/dummy1.jpg', 'ON_SALE'),
('스프링 부트 마스터', '김스프링', '자바출판사', '9781234567891', 25000, 50, 'IT/프로그래밍', 'JPA와 MyBatis를 넘나드는 백엔드 구축기', 'https://s3.ap-northeast-2.amazonaws.com/mybucket/books/dummy2.jpg', 'ON_SALE'),
('도커와 쿠버네티스', '고래와조타수', '인프라북스', '9781234567892', 30000, 10, 'IT/인프라', '한 권으로 끝내는 K8s 완벽 가이드', 'https://s3.ap-northeast-2.amazonaws.com/mybucket/books/dummy3.jpg', 'ON_SALE'),
('안전한 결제 시스템', '박보안', '시큐리티프레스', '9781234567893', 18000, 0, '보안', '트랜잭션과 동시성 제어 실무', 'https://s3.ap-northeast-2.amazonaws.com/mybucket/books/dummy4.jpg', 'STOPPED');

-- 5. 장바구니 더미 데이터 생성 (테스트 유저: member_id=1)
INSERT INTO Cart_Items (member_id, book_id, quantity) VALUES
(1, 1, 2),
(1, 2, 1);
