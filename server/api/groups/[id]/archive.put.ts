import { defineEventHandler, readBody, createError } from "h3";
import {
    getGroupById,
    updateGroup,
} from "../../../repositories/groupRepository";
import { logActivity } from "../../../utils/activityLogger";
import { getPermissionContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id;
    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID учебной группы обязателен",
        });
    }

    // 1. Проверка авторизации и прав
    const context = await getPermissionContext(event);
    if (!context) {
        throw createError({ statusCode: 401, message: "Требуется авторизация" });
    }

    // Разрешаем ADMIN и MANAGER (Модератор)
    if (context.role !== "ADMIN" && context.role !== "MANAGER") {
        throw createError({
            statusCode: 403,
            message: "Недостаточно прав для архивации учебной группы",
        });
    }

    // 2. Чтение данных
    const body = await readBody(event);
    const { isArchived } = body;

    if (typeof isArchived !== "boolean") {
        throw createError({
            statusCode: 400,
            message: "Поле isArchived (boolean) обязательно",
        });
    }

    // 3. Проверка существования группы
    const group = await getGroupById(id);
    if (!group) {
        throw createError({
            statusCode: 404,
            message: "Учебная группа не найдена",
        });
    }

    // 4. Обновление
    const now = new Date();
    const updatedGroup = await updateGroup(id, {
        isArchived,
        isActive: !isArchived,
        archivedAt: isArchived ? now : null, // Если восстанавливаем, то null
        archivedBy: isArchived ? context.userId : null,
    });

    // 5. Логирование
    await logActivity(event, "UPDATE", "GROUP", id, group.code, {
        action: isArchived ? "archive" : "restore",
        previousStatus: group.isArchived,
        newStatus: isArchived,
    });

    return {
        success: true,
        message: isArchived
            ? "Учебная группа перенесена в архив"
            : "Учебная группа восстановлена из архива",
        group: updatedGroup,
    };
});
