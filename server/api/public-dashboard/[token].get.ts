/**
 * GET /api/public-dashboard/:token — публичный дашборд по ссылке (без авторизации)
 *
 * Пароль (если задан) передаётся в заголовке X-Dashboard-Password.
 * ?view=1 — первая загрузка страницы, увеличивает счётчик просмотров
 * (автообновления не считаются).
 *
 * Собственный rate limit: общий /api/public/ лимит (20/мин с блокировкой IP)
 * не подходит для экранов, обновляющихся по таймеру.
 */
import { getClientIp } from "../../utils/clientIp";
import { verifyPassword } from "../../utils/auth";
import { getDashboardByToken, registerView } from "../../repositories/publicDashboardRepository";
import { resolveDashboardData } from "../../services/publicDashboardService";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const PASSWORD_WINDOW_MS = 10 * 60_000;
const MAX_PASSWORD_FAILS = 10;

const hits = new Map<string, number[]>();
const fails = new Map<string, number[]>();

function touch(map: Map<string, number[]>, key: string, windowMs: number): number[] {
  const now = Date.now();
  const list = (map.get(key) || []).filter((t) => now - t < windowMs);
  map.set(key, list);
  if (map.size > 5000) {
    for (const [k, v] of map) if (!v.some((t) => now - t < windowMs)) map.delete(k);
  }
  return list;
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "X-Robots-Tag", "noindex, nofollow");

  const token = String(getRouterParam(event, "token") || "");
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) {
    throw createError({ statusCode: 404, message: "Дашборд не найден" });
  }

  const ip = getClientIp(event) || "unknown";
  const recent = touch(hits, `${ip}|${token}`, WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    setHeader(event, "Retry-After", 60);
    throw createError({ statusCode: 429, message: "Слишком много запросов. Попробуйте через минуту." });
  }
  recent.push(Date.now());

  const dashboard = await getDashboardByToken(token);
  if (!dashboard || !dashboard.isActive) {
    throw createError({ statusCode: 404, message: "Дашборд не найден или ссылка отключена" });
  }
  if (dashboard.expiresAt && new Date(dashboard.expiresAt).getTime() < Date.now()) {
    throw createError({ statusCode: 410, message: "Срок действия ссылки истёк" });
  }

  if (dashboard.passwordHash) {
    const failKey = `${ip}|${token}`;
    const failList = touch(fails, failKey, PASSWORD_WINDOW_MS);
    if (failList.length >= MAX_PASSWORD_FAILS) {
      throw createError({ statusCode: 429, message: "Слишком много неверных попыток. Подождите 10 минут." });
    }
    // Клиент кодирует пароль через encodeURIComponent (заголовки не допускают кириллицу)
    let password = String(getHeader(event, "x-dashboard-password") || "");
    try {
      password = decodeURIComponent(password);
    } catch {
      /* оставляем как есть */
    }
    if (!password) {
      throw createError({ statusCode: 401, message: "Требуется пароль", data: { needPassword: true, title: dashboard.title } });
    }
    if (!(await verifyPassword(password, dashboard.passwordHash))) {
      failList.push(Date.now());
      throw createError({ statusCode: 401, message: "Неверный пароль", data: { needPassword: true, title: dashboard.title } });
    }
  }

  if (getQuery(event).view === "1") {
    registerView(dashboard.id).catch(() => {});
  }

  const data = await resolveDashboardData(dashboard.widgets, dashboard.settings);

  return {
    success: true,
    dashboard: {
      title: dashboard.title,
      description: dashboard.description,
      widgets: dashboard.widgets,
      settings: dashboard.settings,
    },
    data,
    generatedAt: new Date().toISOString(),
  };
});
