-- Скрипт для создания тестового представителя для Telegram Mini App
-- Используется в режиме разработки с chatId = '123456789'

-- Сначала проверяем, есть ли уже такой представитель
DELETE FROM organization_representatives WHERE telegram_chat_id = '123456789';

-- Получаем ID первой организации для теста
SET @org_id = (SELECT id FROM organizations LIMIT 1);

-- Создаём тестового представителя
INSERT INTO organization_representatives (
    id,
    organization_id,
    full_name,
    phone,
    telegram_chat_id,
    telegram_username,
    status,
    permissions,
    notifications_enabled,
    can_receive_notifications,
    created_at,
    updated_at,
    approved_at,
    approved_by
) VALUES (
    UUID(),
    @org_id,
    'Тестовый Представитель',
    '+998901234567',
    '123456789',
    'test_user',
    'approved',
    '{"can_view_students":true,"can_view_schedule":true,"can_view_certificates":true,"can_request_certificates":true}',
    1,
    1,
    NOW(),
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

SELECT 
    'Тестовый представитель создан!' as message,
    r.id,
    r.full_name,
    r.telegram_chat_id,
    r.status,
    o.name as organization_name
FROM organization_representatives r
LEFT JOIN organizations o ON r.organization_id = o.id
WHERE r.telegram_chat_id = '123456789';
