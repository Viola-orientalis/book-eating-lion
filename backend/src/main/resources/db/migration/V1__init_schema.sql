-- V1__init_schema.sql: Initial Table Schema for Book Eating Lion API

CREATE TABLE IF NOT EXISTS Members (
    member_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender ENUM('MALE', 'FEMALE') DEFAULT 'MALE',
    age INT DEFAULT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_deleted (is_deleted, deleted_at)
);

CREATE TABLE IF NOT EXISTS Cards (
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

CREATE TABLE IF NOT EXISTS Books (
    book_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    publisher VARCHAR(100) NOT NULL,
    isbn VARCHAR(50) NULL,
    price BIGINT NOT NULL,
    stock INT DEFAULT 0,
    category VARCHAR(50) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    sale_status ENUM('ON_SALE', 'STOPPED', 'OUT_OF_STOCK') DEFAULT 'ON_SALE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_sale_status (sale_status)
);

CREATE TABLE IF NOT EXISTS Orders (
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

CREATE TABLE IF NOT EXISTS Order_Items (
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

CREATE TABLE IF NOT EXISTS Payments (
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

CREATE TABLE IF NOT EXISTS Cart_Items (
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
