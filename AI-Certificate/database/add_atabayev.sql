-- ========================================
-- Добавление сотрудника Atabayev Ravshanbek
-- ========================================

USE certificate_db;

-- Добавляем сотрудника
INSERT INTO employees (first_name, last_name, middle_name, position, department, email, phone) VALUES
('Ravshanbek', 'Atabayev', NULL, 'Passenger Handling Services Specialist', 'Passenger Services', 'atabayev.r@uzbekistan-airports.uz', '+998901234572');

-- Проверяем добавление
SELECT * FROM employees WHERE last_name = 'Atabayev';
