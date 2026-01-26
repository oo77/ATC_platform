/**
 * API endpoint для регистрации представителя через Telegram Mini App
 */

import {
    createRepresentative,
    getRepresentativeByTelegramChatId
} from '../../repositories/representativeRepository';
import {
    getOrganizationById,
    getOrCreateOrganizationByName
} from '../../repositories/organizationRepository';
import { validateName, validatePhone, normalizePhone } from '../../utils/telegramBot';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const {
            initData,
            fullName,
            phone,
            organizationId,
            organizationName,
            username
        } = body;

        // Валидация
        if (!initData) {
            throw createError({
                statusCode: 400,
                message: 'initData обязателен',
            });
        }

        if (!fullName || !validateName(fullName)) {
            throw createError({
                statusCode: 400,
                message: 'Неверный формат ФИО',
            });
        }

        const normalizedPhone = normalizePhone(phone);
        if (!validatePhone(normalizedPhone)) {
            throw createError({
                statusCode: 400,
                message: 'Неверный формат телефона',
            });
        }

        if (!organizationId && !organizationName) {
            throw createError({
                statusCode: 400,
                message: 'Необходимо указать организацию',
            });
        }

        // Парсим initData
        const params = new URLSearchParams(initData);
        const userStr = params.get('user');

        if (!userStr) {
            throw createError({
                statusCode: 400,
                message: 'Не удалось получить данные пользователя',
            });
        }

        const user = JSON.parse(userStr);
        const chatId = String(user.id);

        // Проверяем, не зарегистрирован ли уже
        const existing = await getRepresentativeByTelegramChatId(chatId);
        if (existing) {
            throw createError({
                statusCode: 409,
                message: 'Вы уже зарегистрированы',
            });
        }

        // Получаем или создаём организацию
        let orgId = organizationId;
        if (!orgId) {
            const organization = await getOrCreateOrganizationByName(organizationName);
            orgId = organization.id;
        } else {
            // Проверяем, существует ли организация
            const organization = await getOrganizationById(orgId);
            if (!organization) {
                throw createError({
                    statusCode: 404,
                    message: 'Организация не найдена',
                });
            }
        }

        // Создаём представителя
        const representative = await createRepresentative({
            fullName: fullName.trim(),
            phone: normalizedPhone,
            telegramChatId: chatId,
            telegramUsername: username || user.username || null,
            organizationId: orgId,
        });

        return {
            success: true,
            message: 'Заявка успешно отправлена',
            representative: {
                id: representative.id,
                fullName: representative.fullName,
                phone: representative.phone,
                telegramUsername: representative.telegramUsername,
                telegramChatId: representative.telegramChatId,
                organizationId: representative.organizationId,
                organizationName: representative.organizationName,
                status: representative.status,
                permissions: representative.permissions,
                createdAt: representative.createdAt,
            },
        };

    } catch (error: any) {
        console.error('[TG-App] Ошибка регистрации:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Внутренняя ошибка сервера',
        });
    }
});
