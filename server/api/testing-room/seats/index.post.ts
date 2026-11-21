/**
 * Посадить слушателя за компьютер: компьютер сам войдёт под ним и откроет тест
 * POST /api/testing-room/seats  { assignmentId, studentId, workstationId, language }
 */
import { Permission, canAccessGroup, requirePermission } from "../../../utils/permissions";
import { audit } from "../../../utils/audit";
import { deliverPendingSeat, notifyTestingRoomAdmins, sendToIp } from "../../../utils/testingRoomHub";
import { getTestAssignmentById } from "../../../repositories/testAssignmentRepository";
import { getAvailableLanguagesForTemplate, getTestTemplateById } from "../../../repositories/testTemplateRepository";
import { getStudentById } from "../../../repositories/studentRepository";
import { executeQuery } from "../../../utils/db";
import {
  closeSeat,
  createSeat,
  getActiveSeatForWorkstation,
  getActiveSeatsForStudent,
  getSeatDetailsById,
  getWorkstationById,
  type Seat,
} from "../../../repositories/testingRoomRepository";

/** Имя слушателя, который прямо сейчас сдаёт тест на этой посадке, иначе null */
async function busyStudent(seat: Seat): Promise<string | null> {
  if (seat.status !== "claimed") return null;
  const details = await getSeatDetailsById(seat.id);
  return details?.sessionStatus === "in_progress" ? details.studentName : null;
}

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.TESTS_ASSIGN);
  const body = await readBody<{
    assignmentId?: string;
    studentId?: string;
    workstationId?: string;
    language?: string;
  }>(event);

  if (!body?.assignmentId || !body.studentId || !body.workstationId || !body.language) {
    throw createError({ statusCode: 400, message: "Укажите тест, слушателя, компьютер и язык" });
  }

  const assignment = await getTestAssignmentById(body.assignmentId);
  if (!assignment) throw createError({ statusCode: 404, message: "Назначение не найдено" });
  if (!(await canAccessGroup(ctx, assignment.group_id))) {
    throw createError({ statusCode: 403, message: "Нет доступа к группе этого теста" });
  }
  if (assignment.status === "cancelled" || assignment.status === "completed") {
    throw createError({ statusCode: 409, message: "Тест закрыт для сдачи" });
  }

  const student = await getStudentById(body.studentId);
  if (!student) throw createError({ statusCode: 404, message: "Слушатель не найден" });
  const inGroup = await executeQuery<any[]>(
    "SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1",
    [assignment.group_id, student.id],
  );
  const allowedIds = assignment.allowed_student_ids;
  if (!inGroup.length || (allowedIds && allowedIds.length && !allowedIds.includes(student.id))) {
    throw createError({ statusCode: 409, message: "Слушатель не сдаёт этот тест" });
  }
  if (!student.userId) {
    throw createError({
      statusCode: 409,
      message: "У слушателя нет учётной записи — создайте её в карточке слушателя",
    });
  }

  const template = await getTestTemplateById(assignment.test_template_id);
  if (!template) throw createError({ statusCode: 404, message: "Шаблон теста не найден" });
  const languages = await getAvailableLanguagesForTemplate(template.id);
  if (!languages.includes(body.language as any)) {
    throw createError({ statusCode: 400, message: "Этот язык недоступен для теста" });
  }

  const workstation = await getWorkstationById(body.workstationId);
  if (!workstation) throw createError({ statusCode: 404, message: "Компьютер не найден" });
  if (!workstation.isActive) throw createError({ statusCode: 409, message: "Компьютер отключён" });

  // Сначала проверяем все конфликты, потом освобождаем — чтобы при ошибке ничего не потерять
  const current = await getActiveSeatForWorkstation(workstation.id);
  const busyHere = current ? await busyStudent(current) : null;
  if (busyHere) {
    throw createError({ statusCode: 409, message: `За «${workstation.name}» сейчас сдаёт тест ${busyHere}` });
  }
  const studentSeats = await getActiveSeatsForStudent(student.id);
  for (const seat of studentSeats) {
    if (await busyStudent(seat)) {
      const other = await getWorkstationById(seat.workstationId);
      throw createError({
        statusCode: 409,
        message: `${student.fullName} уже сдаёт тест за «${other?.name || "другим компьютером"}»`,
      });
    }
  }

  // Освобождаем компьютер и пересаживаем слушателя
  const toClose = [...(current ? [current] : []), ...studentSeats.filter((s) => s.id !== current?.id)];
  for (const seat of toClose) {
    await closeSeat(seat.id, seat.status === "pending" ? "cancelled" : "released");
    if (seat.status === "claimed" && seat.workstationId !== workstation.id) {
      const other = await getWorkstationById(seat.workstationId);
      if (other) sendToIp(other.ipAddress, { type: "release" });
    }
  }

  const seat = await createSeat({
    workstationId: workstation.id,
    assignmentId: assignment.id,
    studentId: student.id,
    language: body.language,
    assignedBy: ctx.userId,
  });

  const delivered = await deliverPendingSeat(workstation);
  notifyTestingRoomAdmins();

  await audit(event, {
    action: "testing_room.seat_assigned",
    category: "data",
    summary: `${student.fullName} → ${workstation.name} (${workstation.ipAddress}), тест «${template.name}»`,
    entity: { type: "TEST_ASSIGNMENT", id: assignment.id, label: template.name },
    metadata: { seatId: seat.id, workstationId: workstation.id, studentId: student.id, delivered },
  });

  return { success: true, seat, delivered };
});
