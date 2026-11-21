/**
 * Вход компьютера класса в тест по одноразовому билету
 * POST /api/testing-room/claim  { ticket }
 *
 * Публичный маршрут: доступ даёт сам билет. Билет приходит компьютеру по
 * WebSocket, когда администратор сажает за него слушателя, живёт 2 минуты,
 * гасится при первом использовании и действует только с IP этого компьютера.
 * Возвращает токены слушателя и id сессии теста — компьютер сразу открывает тест.
 */
import { getStudentById } from "../../repositories/studentRepository";
import {
  closeSeat,
  consumeSeatTicket,
  findPendingSeatByTicket,
  getSeatDetailsById,
  getWorkstationById,
  setSeatSession,
} from "../../repositories/testingRoomRepository";
import { startTestSessionForStudent } from "../../services/testSessionStartService";
import { generateRefreshToken, generateToken, createTokenPayload, toPublicUser } from "../../utils/auth";
import { withAccess } from "../../utils/roleRegistry";
import { executeQuery } from "../../utils/db";
import { audit } from "../../utils/audit";
import { logActivityDirect } from "../../utils/activityLogger";
import { getTestingRoomIp } from "../../utils/testingRoomIp";
import { hashTicket, notifyTestingRoomAdmins } from "../../utils/testingRoomHub";
import type { User } from "../../types/auth";
import type { QuestionLanguage } from "../../types/testing";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ ticket?: string }>(event);
  const ticket = typeof body?.ticket === "string" ? body.ticket : "";
  if (ticket.length < 20 || ticket.length > 200) {
    throw createError({ statusCode: 400, message: "Некорректный билет входа" });
  }

  const ticketHash = hashTicket(ticket);
  const seat = await findPendingSeatByTicket(ticketHash);
  if (!seat) {
    throw createError({ statusCode: 410, message: "Билет входа недействителен или устарел" });
  }

  const workstation = await getWorkstationById(seat.workstationId);
  const ip = getTestingRoomIp(event);
  if (!workstation || workstation.ipAddress !== ip) {
    await audit(event, {
      action: "testing_room.claim_denied",
      category: "security",
      outcome: "denied",
      summary: `Попытка входа в тест по чужому билету с IP ${ip}`,
      metadata: { seatId: seat.id, expectedIp: workstation?.ipAddress, ip },
    });
    throw createError({ statusCode: 403, message: "Билет выдан другому компьютеру" });
  }

  // Атомарно гасим билет: вторая вкладка того же компьютера получит отказ
  if (!(await consumeSeatTicket(seat.id, ticketHash))) {
    throw createError({ statusCode: 409, message: "Вход уже выполнен в другой вкладке" });
  }

  const fail = async (message: string, statusCode = 422) => {
    await closeSeat(seat.id, "cancelled");
    notifyTestingRoomAdmins({ error: { seatId: seat.id, workstationName: workstation.name, message } });
    throw createError({ statusCode, message });
  };

  const student = await getStudentById(seat.studentId);
  if (!student?.userId) return fail("У слушателя нет учётной записи");

  const users = await executeQuery<User[]>("SELECT * FROM users WHERE id = ? LIMIT 1", [student.userId]);
  const user = users[0];
  if (!user) return fail("Учётная запись слушателя не найдена");

  const started = await startTestSessionForStudent({
    assignmentId: seat.assignmentId,
    studentId: student.id,
    language: seat.language as QuestionLanguage,
    ipAddress: ip,
    userAgent: String(getHeader(event, "user-agent") || ""),
  });
  if (!started.success) return fail(started.message);

  await setSeatSession(seat.id, started.session.id);

  const payload = createTokenPayload(user);
  const response = {
    success: true,
    token: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: await withAccess(toPublicUser(user)),
    sessionId: started.session.id as string,
    resumed: !!started.resumed,
  };

  const details = await getSeatDetailsById(seat.id);
  await logActivityDirect(user.id, "LOGIN", "SYSTEM", user.id, user.name, {
    via: "testing_room",
    workstation: workstation.name,
    ip,
  });
  await audit(event, {
    action: "testing_room.kiosk_login",
    category: "auth",
    summary: `${student.fullName} вошёл в тест «${details?.templateName || ""}» за «${workstation.name}» (${ip})`,
    actor: { id: user.id, name: user.name, roleName: user.role },
    entity: { type: "TEST_SESSION", id: started.session.id, label: details?.templateName || null },
    metadata: { seatId: seat.id, workstationId: workstation.id, resumed: !!started.resumed },
  });
  notifyTestingRoomAdmins();

  return response;
});
