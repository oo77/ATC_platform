/**
 * API endpoint для создания тестового представителя (только для разработки)
 */

import { createRepresentative, getRepresentativeByTelegramChatId, approveRepresentative } from '../../repositories/representativeRepository';
import { executeQuery } from '../../utils/db';

export default defineEventHandler(async (event) => {
    // Только в режиме разработки
    if (process.env.NODE_ENV !== 'development') {
        throw createError({
            statusCode: 403,
            message: 'Доступно только в режиме разработки',
        });
    }

    try {
        const testChatId = '123456789';

        // Проверяем, существует ли уже тестовый представитель
        let representative = await getRepresentativeByTelegramChatId(testChatId);

        if (representative) {
            return {
                success: true,
                message: 'Тестовый представитель уже существует',
                representative,
            };
        }

        // Получаем первую организацию
        const organizations = await executeQuery<any[]>(
            'SELECT id, name FROM organizations LIMIT 1'
        );

        if (organizations.length === 0) {
            throw new Error('В базе данных нет организаций. Создайте хотя бы одну организацию.');
        }

        const organization = organizations[0];

        // Создаём представителя
        representative = await createRepresentative({
            organizationId: organization.id,
            fullName: 'Тестовый Представитель',
            phone: '+998901234567',
            telegramChatId: testChatId,
            telegramUsername: 'test_user',
        });

        // Получаем первого админа для одобрения
        const admins = await executeQuery<any[]>(
            "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
        );

        if (admins.length > 0) {
            // Одобряем представителя
            representative = await approveRepresentative(
                representative.id,
                admins[0].id
            ) || representative;
        }

        return {
            success: true,
            message: 'Тестовый представитель создан и одобрен',
            representative,
        };

    } catch (error: any) {
        console.error('[Create Test Representative] Ошибка:', error);
        throw createError({
            statusCode: 500,
            message: error.message || 'Ошибка создания тестового представителя',
        });
    }
});
