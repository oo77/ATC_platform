/**
 * Тестовый endpoint для проверки getPermissionContext
 * GET /api/test/permission-context
 */

import { getPermissionContext, getTeacherGroups } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    try {
        const context = await getPermissionContext(event);

        if (!context) {
            return {
                success: false,
                message: 'Пользователь не авторизован',
            };
        }

        let groups: string[] = [];

        if (context.instructorId) {
            groups = await getTeacherGroups(context.instructorId);
        }

        return {
            success: true,
            context: {
                userId: context.userId,
                role: context.role,
                instructorId: context.instructorId || null,
                studentId: context.studentId || null,
            },
            groups: groups,
            groupsCount: groups.length,
        };
    } catch (error: any) {
        console.error('[Test API] Error:', error);
        return {
            success: false,
            message: error.message,
        };
    }
});
