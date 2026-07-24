SET NAMES utf8mb4;
-- 데모 및 테스트용 초기 더미 데이터 (demo_data.sql)

-- 0. 기존 데이터 초기화
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Cart_Items;
TRUNCATE TABLE Order_Items;
TRUNCATE TABLE Payments;
TRUNCATE TABLE Orders;
TRUNCATE TABLE Books;
TRUNCATE TABLE Cards;
TRUNCATE TABLE Members;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. 테스트 유저 생성 (비밀번호는 1234)
INSERT INTO Members (username, password, name, gender, age, role) VALUES 
('testuser1', '$2a$10$fHX4VHdsN2kPrh0GJgNjjeIb.FZJ6ApJZf5UFoUZaO.D8j3y2CqXK', '테스트유저1', 'MALE', 25, 'USER'),
('testuser2', '$2a$10$fHX4VHdsN2kPrh0GJgNjjeIb.FZJ6ApJZf5UFoUZaO.D8j3y2CqXK', '테스트유저2', 'FEMALE', 19, 'USER'),
('testuser3', '$2a$10$fHX4VHdsN2kPrh0GJgNjjeIb.FZJ6ApJZf5UFoUZaO.D8j3y2CqXK', '테스트유저3', 'MALE', 35, 'USER'),
('testuser4', '$2a$10$fHX4VHdsN2kPrh0GJgNjjeIb.FZJ6ApJZf5UFoUZaO.D8j3y2CqXK', '테스트유저4', 'FEMALE', 42, 'USER');

-- 2. 테스트 관리자(ADMIN) 생성 (비밀번호 1234)
INSERT INTO Members (username, password, name, gender, age, role) 
VALUES ('admin', '$2a$10$fHX4VHdsN2kPrh0GJgNjjeIb.FZJ6ApJZf5UFoUZaO.D8j3y2CqXK', '관리자', 'MALE', 30, 'ADMIN');


-- 3. 도서 더미 데이터 생성 (실제 S3 이미지 URL 연결)
INSERT INTO Books (title, author, publisher, isbn, price, stock, category, description, image_url, sale_status) VALUES
('방구석 미술관', '조원재', '블랙피쉬', '9791165961084', 17500, 19, '미술', '어렵게만 느껴지던 명화를 편안한 입담으로 풀어내는 미술 교양서.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/art_01.png', 'ON_SALE'),
('고흐, 영혼의 편지', '빈센트 반 고흐', '예담', '9788970132435', 16500, 8, '미술', '고흐가 동생 테오에게 보낸 편지를 통해 그의 삶과 예술을 들여다보는 책.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/art_02.png', 'ON_SALE'),
('언어의 온도', '이기주', '말글터', '9791195829907', 13000, 25, '에세이', '말과 글에 담긴 온기에 대해 이야기하는 에세이.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/essay_01.png', 'ON_SALE'),
('삶의 격', '피터 비에리', '은행나무', '9788956607000', 16000, 15, '에세이', '존엄성을 다해 살아간다는 것에 대한 깊은 성찰.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/essay_02.png', 'ON_SALE'),
('모든 순간이 너였다', '하태완', '위즈덤하우스', '9791162202913', 13800, 20, '에세이', '위로와 응원이 필요한 순간 전하는 따뜻한 메시지.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/essay_03.png', 'ON_SALE'),
('총, 균, 쇠', '재레드 다이아몬드', '김영사', '9791188114287', 22000, 14, '역사', '문명의 불균형을 지리와 환경의 관점에서 추적하는 역사 명저.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/history_01.png', 'ON_SALE'),
('역사의 쓸모', '최태성', '다산초당', '9791190456123', 16000, 11, '역사', '역사 속 인물들의 선택에서 오늘을 살아갈 지혜를 찾는 이야기.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/history_02.png', 'ON_SALE'),
('사피엔스', '유발 하라리', '김영사', '9788934972464', 22000, 18, '역사', '유인원에서 사이보그까지, 인간 역사의 대담한 통찰.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/history_03.png', 'ON_SALE'),
('미움받을 용기', '기시미 이치로', '인플루엔셜', '9788901219135', 14900, 22, '인문', '아들러 심리학을 대화체로 풀어낸 자기 이해의 인문서.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/humanity_01.png', 'ON_SALE'),
('정의란 무엇인가', '마이클 샌델', '와이즈베리', '9788958309980', 18000, 13, '인문', '정의를 둘러싼 철학적 질문들을 다양한 사례로 풀어낸 책.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/humanity_02.png', 'ON_SALE'),
('소크라테스의 변명', '플라톤', '돋을새김', '9788961670159', 10000, 30, '인문', '진리와 서양 철학의 뿌리를 찾는 고전 명작.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/humanity_03.png', 'ON_SALE'),
('생각에 관한 생각', '다니엘 카네만', '김영사', '9788934957867', 22000, 10, '인문', '노벨상 수상자가 밝혀내는 인간 심리와 직관의 실체.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/humanity_04.png', 'ON_SALE'),
('달러구트 꿈 백화점', '이미예', '팩토리나인', '9791165341909', 14500, 20, '소설', '잠들어야만 입장할 수 있는 상점, 달러구트 꿈 백화점에서 벌어지는 따뜻한 이야기.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/novel_01.png', 'ON_SALE'),
('불편한 편의점', '김호연', '나무옆의자', '9791161571188', 14000, 15, '소설', '서울역 앞 작은 편의점을 중심으로 펼쳐지는 사람들의 이야기.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/novel_02.png', 'ON_SALE'),
('아몬드', '손원평', '창비', '9788936455324', 13500, 18, '소설', '감정을 느끼지 못하는 소년 윤재가 세상과 관계 맺는 법을 배우는 성장 소설.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/novel_03.png', 'ON_SALE'),
('코스모스', '칼 세이건', '사이언스북스', '9788983711892', 23000, 16, '과학', '우주와 인간의 자리를 성찰하게 하는 과학 교양서의 고전.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/science_01.png', 'ON_SALE'),
('이기적 유전자', '리처드 도킨스', '을유문화사', '9788935600097', 20000, 10, '과학', '유전자의 관점에서 생명과 진화를 설명하는 진화생물학 고전.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/science_02.png', 'ON_SALE'),
('역행자', '자청', '웅진지식하우스', '9788901261127', 17000, 30, '자기계발', '평범한 사람이 부와 자유를 얻기 위한 7단계 자기계발서.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/self_01.png', 'ON_SALE'),
('원씽', '게리 켈러', '비즈니스북스', '9788997575169', 14000, 25, '자기계발', '복잡한 세상을 이기는 단 하나의 원칙.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/self_02.png', 'ON_SALE'),
('아주 작은 습관의 힘', '제임스 클리어', '비즈니스북스', '9791162540640', 16000, 20, '자기계발', '매일 1%씩 변화하는 아주 작은 습관의 놀라운 힘.', 'https://team3-bookeatinglion-storage-s3.s3.ap-northeast-2.amazonaws.com/books/self_03.png', 'ON_SALE');

-- 4. 장바구니 더미 데이터 생성 (테스트 유저: member_id=1)
INSERT INTO Cart_Items (member_id, book_id, quantity) VALUES
(1, 1, 2),
(1, 2, 1);
