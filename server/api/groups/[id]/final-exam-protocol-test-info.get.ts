/**
 * GET /api/groups/:id/final-exam-protocol-test-info
 * Сведения о группе для формы «Bayonnoma (тест)»: код группы, название программы, число
 * слушателей, краткое название курса (значение по умолчанию для «Imtihon tartibi»), дата
 * последнего завершённого теста группы (подсказка для даты протокола) и число слушателей
 * с результатом теста (см. POST /api/groups/:id/final-exam-protocol-test).
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import {
  loadFinalExamProtocolTestModel,
  loadLastTestDate,
} from "../../../services/finalExamProtocolTestService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { courseShortTitle } from "../../../../shared/utils/finalExamProtocol";

export default defineEventHandler(async (event) => {
  try {
    const context = await getPermissionContext(event);
    if (!context) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Требуется авторизация",
      });
    }

    const canView =
      roleHasPermission(context, Permission.GROUPS_VIEW_ALL) ||
      roleHasPermission(context, Permission.GROUPS_VIEW_OWN);
    if (!canView) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Недостаточно прав для просмотра группы",
      });
    }

    const groupId = getRouterParam(event, "id");
    if (!groupId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "ID группы не указан",
      });
    }

    if (!(await canAccessGroup(context, groupId))) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Нет доступа к этой группе",
      });
    }

    const model = await loadFinalExamProtocolTestModel(groupId);
    if (!model) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Группа не найдена",
      });
    }

    return {
      success: true,
      groupCode: model.groupCode,
      courseName: model.courseName,
      courseTitle: courseShortTitle(model.courseName),
      studentsCount: model.students.length,
      withResultCount: model.results.filter((result) => result.hasResult).length,
      lastTestDate: await loadLastTestDate(groupId),
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error("[API] Ошибка загрузки сведений для протокола экзамена (тест):", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка загрузки сведений о группе",
    });
  }
});
