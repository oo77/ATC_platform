import { getRequestHeader, getRequestIP, type H3Event } from "h3";

/**
 * IP клиента для ограничения частоты запросов и журнала.
 *
 * getRequestIP(event, { xForwardedFor: true }) берёт ПЕРВЫЙ адрес из X-Forwarded-For —
 * его присылает сам клиент, и подменой заголовка обходились лимиты попыток.
 * Надёжен только адрес, который дописал НАШ прокси: TRUST_PROXY_HOPS-й справа.
 *   TRUST_PROXY_HOPS=1 (по умолчанию) — один обратный прокси (nginx / cPanel);
 *   TRUST_PROXY_HOPS=0 — прокси нет, X-Forwarded-For игнорируется.
 */
export function getClientIp(event: H3Event): string {
  const hops = Math.max(0, parseInt(process.env.TRUST_PROXY_HOPS ?? "1", 10) || 0);
  if (hops > 0) {
    const header = getRequestHeader(event, "x-forwarded-for");
    if (header) {
      const list = header.split(",").map((s) => s.trim()).filter(Boolean);
      const candidate = list[list.length - hops];
      if (candidate) return candidate;
    }
  }
  return getRequestIP(event) || "unknown";
}
