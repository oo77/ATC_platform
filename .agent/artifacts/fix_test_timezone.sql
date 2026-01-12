-- Исправление часового пояса для существующих test_assignments
-- Проблема: start_date хранится в UTC, а нужно в локальном времени (UTC+5)

-- Вариант 1: Добавить 5 часов к существующим записям
UPDATE test_assignments ta
JOIN schedule_events se ON ta.schedule_event_id = se.id
SET ta.start_date = DATE_ADD(se.start_time, INTERVAL 5 HOUR)
WHERE ta.start_date IS NOT NULL;

-- Вариант 2: Просто взять start_time из schedule_events (если там уже локальное время)
-- UPDATE test_assignments ta
-- JOIN schedule_events se ON ta.schedule_event_id = se.id
-- SET ta.start_date = se.start_time
-- WHERE ta.start_date IS NOT NULL;

-- Вариант 3: Обнулить start_date (тесты доступны сразу)
-- UPDATE test_assignments SET start_date = NULL;

-- Проверить результат
SELECT 
    ta.id,
    tt.name as template_name,
    ta.start_date as test_start,
    se.start_time as event_start,
    ta.status
FROM test_assignments ta
LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
ORDER BY ta.created_at DESC;
