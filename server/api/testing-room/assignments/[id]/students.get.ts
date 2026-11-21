/**
 * Слушатели назначенного теста: попытки, результат, за каким компьютером сидят
 * GET /api/testing-room/assignments/:id/students
 */
import { Permission, canAccessGroup, requirePermission } from "../../../../utils/permissions";
import { getTestAssignmentById } from "../../../../repositories/testAssignmentRepository";
import { getAvailableLanguagesForTemplate, getTestTemplateById } from "../../../../repositories/testTemplateRepository";
import { getAssignmentStudents } from "../../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.TESTS_ASSIGN);
  const assignment = await getTestAssignmentById(getRouterParam(event, "id")!);
  if (!assignment) throw createError({ statusCode: 404, message: "Назначение не найдено" });
  if (!(await canAccessGroup(ctx, assignment.group_id))) {
    throw createError({ statusCode: 403, message: "Нет доступа к группе этого теста" });
  }

  const template = await getTestTemplateById(assignment.test_template_id);
  const [students, languages] = await Promise.all([
    getAssignmentStudents(assignment.id, assignment.group_id, assignment.allowed_student_ids),
    template ? getAvailableLanguagesForTemplate(template.id) : Promise.resolve([]),
  ]);

  return {
    success: true,
    assignment: {
      id: assignment.id,
      templateName: assignment.template_name,
      groupCode: assignment.group_name,
      status: assignment.status,
      maxAttempts: template?.max_attempts ?? 1,
      timeLimitMinutes: assignment.time_limit_override || template?.time_limit_minutes || null,
    },
    languages,
    students,
  };
});
