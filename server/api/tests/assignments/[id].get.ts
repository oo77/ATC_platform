/**
 * API endpoint для получения назначения по ID
 * GET /api/tests/assignments/:id
 */

import { getTestAssignmentById } from '../../../repositories/testAssignmentRepository';
import { Permission, requireAnyPermission } from "../../../utils/permissions";
import { requireTestAssignmentAccess } from "../../../utils/resourceAccess";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: право + доступ к группе назначения
  await requireTestAssignmentAccess(event, getRouterParam(event, "id"), "read");

    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID назначения не указан',
            };
        }

        const assignment = await getTestAssignmentById(id);

        if (!assignment) {
            return {
                success: false,
                message: 'Назначение не найдено',
            };
        }

        return {
            success: true,
            assignment,
        };
    } catch (error) {
        console.error('Ошибка получения назначения:', error);

        return {
            success: false,
            message: 'Ошибка при получении назначения',
        };
    }
});
