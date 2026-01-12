-- Исправление существующих test_assignments
-- Устанавливаем start_date и end_date из schedule_events

-- Обновляем все записи: берём время начала и окончания из занятия
UPDATE test_assignments ta
JOIN schedule_events se ON ta.schedule_event_id = se.id
SET 
    ta.start_date = se.start_time,
    ta.end_date = se.end_time
WHERE se.start_time IS NOT NULL;

-- Проверка результата
SELECT 
    ta.id,
    tt.name as test_name,
    ta.start_date,
    ta.end_date,
    se.start_time as event_start,
    se.end_time as event_end,
    ta.status,
    CASE 
        WHEN ta.end_date < NOW() THEN 'Просрочен'
        WHEN ta.start_date > NOW() THEN 'Ожидает начала'
        ELSE 'Доступен'
    END as calculated_status
FROM test_assignments ta
LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
ORDER BY ta.created_at DESC;
