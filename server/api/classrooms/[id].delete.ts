/**
 * DELETE /api/classrooms/:id
 * Удаление аудитории
 */

import { deleteClassroom } from '../../repositories/scheduleRepository';

export default defineEventHandler(async (event) => {
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
