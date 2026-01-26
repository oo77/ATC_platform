/**
 * API endpoint для авторизации в Telegram Mini App
 * Проверяет initData и возвращает данные представителя
 */

import { getRepresentativeByTelegramChatId } from '../../repositories/representativeRepository';

export default defineEventHandler(async (event) => {
    try {
        console.log('[TG-App Auth] Начало авторизации');
        const body = await readBody(event);
        console.log('[TG-App Auth] Получено тело запроса:', { hasInitData: !!body?.initData });
        const { initData, user: bodyUser } = body;

        if (!initData) {
            console.error('[TG-App Auth] initData отсутствует');
            throw createError({
                statusCode: 400,
                message: 'initData обязателен',
            });
        }

        let chatId: string = '';

        // В режиме разработки поддерживаем mock данные
        if (initData === 'dev_mode' && process.env.NODE_ENV === 'development') {
            console.warn('[DEV MODE] Используем mock chatId для тестирования');
            chatId = '123456789';
            console.log('[TG-App Auth] Dev mode chatId:', chatId);
        } else {
            console.log('[TG-App Auth] Парсим данные...');

            // Пробуем получить user из body (явно переданный с клиента)
            if (bodyUser && bodyUser.id) {
                console.log('[TG-App Auth] User получен из body:', bodyUser.id);
                chatId = String(bodyUser.id);
            } else {
                // Если нет в body, пробуем распарсить initData (fallback)
                const params = new URLSearchParams(initData);
                console.log('[TG-App Auth] Keys in initData:', [...params.keys()]);
                const userStr = params.get('user');
                console.log('[TG-App Auth] User string from initData:', userStr ? 'получен' : 'отсутствует');

                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        chatId = String(user.id);
                    } catch (e) {
                        console.error('[TG-App Auth] Ошибка парсинга user string:', e);
                    }
                }
            }

            if (!chatId) {
                console.error('[TG-App Auth] Не удалось получить chatId ни из body, ни из initData');
                throw createError({
                    statusCode: 400,
                    message: 'Не удалось получить данные пользователя',
                });
            }

            console.log('[TG-App Auth] Итоговый chatId:', chatId);
        }

        // Проверяем, существует ли представитель
        console.log('[TG-App Auth] Ищем представителя с chatId:', chatId);
        const representative = await getRepresentativeByTelegramChatId(chatId);

        if (!representative) {
            console.warn('[TG-App Auth] Представитель не найден для chatId:', chatId);
            throw createError({
                statusCode: 404,
                message: 'Пользователь не найден',
            });
        }

        console.log('[TG-App Auth] Представитель найден:', {
            id: representative.id,
            fullName: representative.fullName,
            status: representative.status,
        });

        // Возвращаем данные представителя
        return {
            success: true,
            representative: {
                id: representative.id,
                fullName: representative.fullName,
                phone: representative.phone,
                telegramChatId: representative.telegramChatId,
                telegramUsername: representative.telegramUsername,
                organizationId: representative.organizationId,
                organizationName: representative.organizationName,
                status: representative.status,
                blockedReason: representative.blockedReason,
                permissions: representative.permissions,
                createdAt: representative.createdAt,
                approvedAt: representative.approvedAt,
                lastActivityAt: representative.lastActivityAt,
            },
        };

    } catch (error: any) {
        console.error('[TG-App] Ошибка авторизации:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Внутренняя ошибка сервера',
        });
    }
});
