/**
 * Автоматический аудит запросов.
 *
 * - Каждому запросу присваивается request_id (связывает все записи одного действия).
 * - Каждый ИЗМЕНЯЮЩИЙ запрос к /api (POST/PUT/PATCH/DELETE) попадает в журнал,
 *   даже если эндпоинт сам ничего не записал: кто, что вызвал, результат, HTTP-статус.
 * - Каждый ОТКАЗ в доступе (401/403) на любом методе попадает в журнал как событие
 *   безопасности — видно, кто пытался получить то, на что нет прав.
 * Если эндпоинт уже записал подробное событие через audit(), общая запись не дублируется.
 */

import type { H3Event } from "h3";
import { audit, getRequestId } from "../utils/audit";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Шумные служебные запросы, которые не несут смысла для аудита */
const SKIP_PATHS = [
  "/api/auth/refresh",
  "/api/auth/verify",
  "/api/telegram/webhook",
  "/api/library/reading/", // прогресс чтения пишется каждые несколько секунд
  "/api/tests/sessions/", // ответы на вопросы теста (итог фиксируется отдельно)
  "/api/attestation/sessions/",
  "/api/ai/chat/message",
  "/api/environment/check-db",
];

function shouldSkip(path: string): boolean {
  return SKIP_PATHS.some((p) => path.startsWith(p));
}

function outcomeOf(status: number): "success" | "denied" | "failed" {
  if (status === 401 || status === 403) return "denied";
  if (status >= 400) return "failed";
  return "success";
}

const METHOD_LABEL: Record<string, string> = {
  POST: "Создание/действие",
  PUT: "Изменение",
  PATCH: "Изменение",
  DELETE: "Удаление",
  GET: "Просмотр",
};

async function recordRequest(event: H3Event, status: number, errorMessage?: string) {
  const path = (event.path || "").split("?")[0] || "";
  if (!path.startsWith("/api") || shouldSkip(path)) return;
  if (event.context.auditAutoRecorded) return;
  if (event.context.auditRecorded) {
    // Эндпоинт уже записал подробное событие — дописываем только HTTP-статус
    event.context.auditAutoRecorded = true;
    await setStatus(event, status);
    return;
  }

  const method = (event.method || "GET").toUpperCase();
  const outcome = outcomeOf(status);
  // Чтение без отказа не журналируем (шум); изменения и отказы — всегда
  if (!MUTATING.has(method) && outcome !== "denied") return;
  // Анонимные 401 на публичной поверхности — не событие безопасности пользователя
  if (outcome === "denied" && status === 401 && !event.context.user) {
    // но попытки без входа к закрытым изменяющим маршрутам всё же фиксируем
    if (!MUTATING.has(method)) return;
  }

  event.context.auditAutoRecorded = true;
  const label = METHOD_LABEL[method] || method;
  await audit(event, {
    action: outcome === "denied" ? "access.denied" : `http.${method.toLowerCase()}`,
    category: outcome === "denied" ? "security" : "data",
    outcome,
    summary:
      outcome === "denied"
        ? `Отказано в доступе: ${method} ${path}${errorMessage ? ` — ${errorMessage}` : ""}`
        : `${label}: ${method} ${path}${outcome === "failed" ? ` (ошибка ${status})` : ""}`,
    metadata: { status, ...(errorMessage && outcome !== "success" ? { error: errorMessage.slice(0, 300) } : {}) },
  });

  await setStatus(event, status);
}

/** HTTP-статус дописываем всем записям этого запроса (для фильтрации по результату) */
async function setStatus(event: H3Event, status: number) {
  try {
    const { executeQuery } = await import("../utils/db");
    await executeQuery(
      "UPDATE audit_events SET http_status = ? WHERE request_id = ? AND http_status IS NULL",
      [status, getRequestId(event)],
    );
  } catch {
    /* таблицы может не быть до миграции */
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    getRequestId(event);
  });

  nitroApp.hooks.hook("afterResponse", async (event) => {
    if (!event) return;
    await recordRequest(event, event.node?.res?.statusCode || 200);
  });

  nitroApp.hooks.hook("error", async (error: any, ctx: any) => {
    const event: H3Event | undefined = ctx?.event;
    if (!event) return;
    const status = Number(error?.statusCode || error?.status || 500);
    await recordRequest(event, status, error?.message || error?.statusMessage);
  });
});
