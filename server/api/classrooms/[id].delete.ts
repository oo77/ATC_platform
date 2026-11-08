/**
 * DELETE /api/classrooms/:id
 * Удаление аудитории
 */

import { deleteClassroom } from '../../repositories/scheduleRepository';
import { Permission, requirePermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.CLASSROOMS_MANAGE);

    try {
        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'ID аудитории обязателен',
            });
        }

        const success = await deleteClassroom(id);

        if (!success) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Аудитория не найдена',
            });
        }

        return {
            success: true,
            message: 'Аудитория успешно удалена',
        };
    } catch (error: any) {
        console.error('Error deleting classroom:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при удалении аудитории',
        });
    }
});
