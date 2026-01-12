-- Исправление существующих test_assignments
-- Убираем start_date чтобы тесты были доступны сразу

-- Обновляем записи где start_date в будущем
UPDATE test_assignments 
SET start_date = NULL 
WHERE start_date > NOW();

-- Или можно обнулить все start_date для простоты:
-- UPDATE test_assignments SET start_date = NULL;

-- Проверяем результат
SELECT id, test_template_id, start_date, end_date, status 
FROM test_assignments 
ORDER BY created_at DESC;
