-- ========================================
-- 🗄️ SQL скрипт для создания базы данных
-- Система управления сертификатами
-- MySQL 5.7+ / MariaDB 10.2+
-- ========================================

-- Создание базы данных
CREATE DATABASE IF NOT EXISTS certificate_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE certificate_db;

-- ========================================
-- 📋 Таблица: Сотрудники
-- ========================================

DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL COMMENT 'Имя',
    last_name VARCHAR(100) NOT NULL COMMENT 'Фамилия',
    middle_name VARCHAR(100) DEFAULT NULL COMMENT 'Отчество',
    position VARCHAR(200) NOT NULL COMMENT 'Должность',
    department VARCHAR(200) NOT NULL COMMENT 'Отдел',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email',
    phone VARCHAR(50) DEFAULT NULL COMMENT 'Телефон',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Дата создания',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Дата обновления',
    
    -- Индексы для быстрого поиска
    INDEX idx_email (email),
    INDEX idx_department (department),
    INDEX idx_full_name (last_name, first_name),
    INDEX idx_position (position)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Таблица сотрудников';

-- ========================================
-- 📜 Таблица: Сертификаты
-- ========================================

CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL COMMENT 'ID сотрудника',
    certificate_number VARCHAR(100) NOT NULL UNIQUE COMMENT 'Номер сертификата',
    certificate_type VARCHAR(200) NOT NULL COMMENT 'Тип сертификата',
    issuing_organization VARCHAR(300) NOT NULL COMMENT 'Выдавшая организация',
    issue_date DATE NOT NULL COMMENT 'Дата выдачи',
    expiry_date DATE DEFAULT NULL COMMENT 'Срок действия',
    course_name VARCHAR(300) NOT NULL COMMENT 'Название курса',
    course_hours INT DEFAULT NULL COMMENT 'Количество часов',
    status ENUM('active', 'expired', 'pending') DEFAULT 'active' COMMENT 'Статус',
    file_url VARCHAR(500) NOT NULL COMMENT 'URL файла',
    file_name VARCHAR(255) NOT NULL COMMENT 'Имя файла',
    file_type VARCHAR(100) NOT NULL COMMENT 'Тип файла',
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending' COMMENT 'Статус проверки',
    extracted_data JSON DEFAULT NULL COMMENT 'Данные извлечённые AI',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Дата создания',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Дата обновления',
    
    -- Внешний ключ
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Индексы
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_cert_number (certificate_number),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_issue_date (issue_date),
    INDEX idx_cert_type (certificate_type)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Таблица сертификатов';

-- ========================================
-- 📊 Тестовые данные
-- ========================================

-- Добавление тестовых сотрудников
INSERT INTO employees (first_name, last_name, middle_name, position, department, email, phone) VALUES
('Иван', 'Иванов', 'Иванович', 'Старший пилот', 'Лётная служба', 'ivanov@example.com', '+998901234567'),
('Петр', 'Петров', 'Петрович', 'Бортинженер', 'Техническая служба', 'petrov@example.com', '+998901234568'),
('Мария', 'Сидорова', 'Александровна', 'Бортпроводник', 'Служба обслуживания', 'sidorova@example.com', '+998901234569'),
('Анна', 'Кузнецова', 'Сергеевна', 'Диспетчер', 'Служба управления полётами', 'kuznetsova@example.com', '+998901234570'),
('Дмитрий', 'Смирнов', 'Александрович', 'Механик', 'Техническая служба', 'smirnov@example.com', '+998901234571');

-- Добавление тестовых сертификатов
INSERT INTO certificates (
    employee_id, 
    certificate_number, 
    certificate_type, 
    issuing_organization, 
    issue_date, 
    expiry_date, 
    course_name, 
    course_hours, 
    status, 
    file_url, 
    file_name, 
    file_type, 
    verification_status,
    extracted_data
) VALUES 
(
    1,
    'AV-2024-001234',
    'Авиационная безопасность',
    'Международный авиационный учебный центр',
    '2024-01-15',
    '2027-01-15',
    'Авиационная безопасность и охрана труда',
    72,
    'active',
    '/uploads/cert-1.pdf',
    'certificate_ivanov.pdf',
    'application/pdf',
    'verified',
    JSON_OBJECT(
        'fullName', 'Иванов Иван Иванович',
        'certificateNumber', 'AV-2024-001234',
        'confidence', 0.95
    )
),
(
    2,
    'TE-2024-005678',
    'Охрана труда',
    'Центр профессиональной подготовки',
    '2024-02-20',
    '2027-02-20',
    'Охрана труда в авиации',
    40,
    'active',
    '/uploads/cert-2.pdf',
    'certificate_petrov.pdf',
    'application/pdf',
    'verified',
    JSON_OBJECT(
        'fullName', 'Петров Петр Петрович',
        'certificateNumber', 'TE-2024-005678',
        'confidence', 0.92
    )
),
(
    3,
    'FA-2023-009876',
    'Первая помощь',
    'Медицинский учебный центр',
    '2023-03-10',
    '2024-03-10',
    'Первая помощь на борту воздушного судна',
    24,
    'expired',
    '/uploads/cert-3.pdf',
    'certificate_sidorova.pdf',
    'application/pdf',
    'verified',
    JSON_OBJECT(
        'fullName', 'Сидорова Мария Александровна',
        'certificateNumber', 'FA-2023-009876',
        'confidence', 0.88
    )
);

-- ========================================
-- 📈 Полезные представления (Views)
-- ========================================

-- Представление: Активные сертификаты с информацией о сотрудниках
CREATE OR REPLACE VIEW active_certificates AS
SELECT 
    c.id,
    c.certificate_number,
    c.certificate_type,
    c.issue_date,
    c.expiry_date,
    CONCAT(e.last_name, ' ', e.first_name, ' ', IFNULL(e.middle_name, '')) as employee_full_name,
    e.position,
    e.department,
    e.email,
    DATEDIFF(c.expiry_date, CURDATE()) as days_until_expiry
FROM certificates c
JOIN employees e ON c.employee_id = e.id
WHERE c.status = 'active'
ORDER BY c.expiry_date ASC;

-- Представление: Истекающие сертификаты (в течение 30 дней)
CREATE OR REPLACE VIEW expiring_soon_certificates AS
SELECT 
    c.*,
    CONCAT(e.last_name, ' ', e.first_name, ' ', IFNULL(e.middle_name, '')) as employee_full_name,
    e.email,
    e.phone,
    DATEDIFF(c.expiry_date, CURDATE()) as days_left
FROM certificates c
JOIN employees e ON c.employee_id = e.id
WHERE c.status = 'active'
    AND c.expiry_date IS NOT NULL
    AND c.expiry_date > CURDATE()
    AND DATEDIFF(c.expiry_date, CURDATE()) <= 30
ORDER BY c.expiry_date ASC;

-- ========================================
-- 🔍 Полезные хранимые процедуры
-- ========================================

DELIMITER //

-- Процедура: Получить статистику по сертификатам
CREATE PROCEDURE get_certificate_stats()
BEGIN
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE 
            WHEN status = 'active' 
            AND expiry_date IS NOT NULL 
            AND DATEDIFF(expiry_date, CURDATE()) BETWEEN 0 AND 30 
            THEN 1 ELSE 0 
        END) as expiring_soon
    FROM certificates;
END //

-- Процедура: Получить сертификаты сотрудника
CREATE PROCEDURE get_employee_certificates(IN emp_id INT)
BEGIN
    SELECT 
        c.*,
        DATEDIFF(c.expiry_date, CURDATE()) as days_until_expiry
    FROM certificates c
    WHERE c.employee_id = emp_id
    ORDER BY c.issue_date DESC;
END //

-- Процедура: Поиск сотрудников
CREATE PROCEDURE search_employees(IN search_query VARCHAR(255))
BEGIN
    SELECT * FROM employees
    WHERE 
        CONCAT(last_name, ' ', first_name, ' ', IFNULL(middle_name, '')) LIKE CONCAT('%', search_query, '%')
        OR position LIKE CONCAT('%', search_query, '%')
        OR department LIKE CONCAT('%', search_query, '%')
        OR email LIKE CONCAT('%', search_query, '%')
    ORDER BY last_name, first_name;
END //

DELIMITER ;

-- ========================================
-- ✅ Проверка создания
-- ========================================

-- Показать созданные таблицы
SHOW TABLES;

-- Показать структуру таблиц
DESCRIBE employees;
DESCRIBE certificates;

-- Показать количество записей
SELECT 'Сотрудников:' as info, COUNT(*) as count FROM employees
UNION ALL
SELECT 'Сертификатов:', COUNT(*) FROM certificates;

-- Показать представления
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';

-- Показать процедуры
SHOW PROCEDURE STATUS WHERE Db = 'certificate_db';

-- ========================================
-- 🎉 База данных готова!
-- ========================================

SELECT '✅ База данных успешно создана и заполнена тестовыми данными!' as status;
