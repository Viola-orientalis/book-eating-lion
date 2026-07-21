-- DB 스키마 정의 (MySQL 기준)

DROP TABLE IF EXISTS Cart_Items;
DROP TABLE IF EXISTS Statements;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Order_Items;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Books;

DROP TABLE IF EXISTS Cards;
DROP TABLE IF EXISTS Members;

-- 1. Members
CREATE TABLE Members (
    member_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_deleted (is_deleted, deleted_at)
);

-- 2. Cards
CREATE TABLE Cards (
    card_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    card_token VARCHAR(255) UNIQUE NOT NULL,
    masked_card_number VARCHAR(19) NOT NULL,
    card_status ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED') DEFAULT 'ACTIVE',
    monthly_limit BIGINT NOT NULL,
    current_usage BIGINT DEFAULT 0,
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    INDEX idx_member (member_id),
    INDEX idx_deleted (is_deleted, deleted_at)
);

-- 4. Books
CREATE TABLE Books (
    book_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    publisher VARCHAR(100) NOT NULL,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    price BIGINT NOT NULL,
    stock INT DEFAULT 0,
    category VARCHAR(50) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    sale_status ENUM('ON_SALE', 'STOPPED') DEFAULT 'ON_SALE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_sale_status (sale_status)
);

-- 5. Orders
CREATE TABLE Orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    order_status ENUM('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'CANCELLED') DEFAULT 'PENDING_PAYMENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    INDEX idx_member (member_id),
    INDEX idx_order_status (order_status)
);

-- 6. Order_Items
CREATE TABLE Order_Items (
    order_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price BIGINT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_book (book_id)
);

-- 7. Payments
CREATE TABLE Payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    card_id BIGINT NULL,

    payment_method ENUM('CARD', 'KAKAOPAY') DEFAULT 'CARD',
    pg_tid VARCHAR(100) NULL,
    approval_number VARCHAR(50) UNIQUE NULL,
    amount BIGINT NOT NULL,
    payment_status ENUM('APPROVED', 'DECLINED', 'CANCELLED') NOT NULL,
    decline_reason VARCHAR(500) NULL,
    idempotency_key VARCHAR(64) UNIQUE NULL,
    approved_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES Cards(card_id) ON DELETE SET NULL,

    INDEX idx_order (order_id),
    INDEX idx_card_approved (card_id, approved_at)
);

-- 8. Statements
CREATE TABLE Statements (
    statement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    card_id BIGINT NULL,
    period_start DATE NOT NULL,
    payment_method ENUM('CARD', 'KAKAOPAY', 'ALL') DEFAULT 'ALL',
    period_end DATE NOT NULL,
    total_amount BIGINT NOT NULL,
    s3_object_key VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES Cards(card_id) ON DELETE SET NULL,
    INDEX idx_member_card (member_id, card_id),
    INDEX idx_period (period_start, period_end)
);

-- 9. Cart_Items
CREATE TABLE Cart_Items (
    cart_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE,
    UNIQUE KEY uk_member_book (member_id, book_id),
    INDEX idx_member (member_id)
);
