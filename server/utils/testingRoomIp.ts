import type { H3Event } from "h3";

/**
 * IP компьютера для класса тестирования.
 *
 * Компьютер класса узнаётся по IP, поэтому X-Forwarded-For учитываем, только
 * если соединение пришло с локального обратного прокси (127.0.0.1 / ::1):
 * тогда берём адрес, который дописал НАШ прокси (TRUST_PROXY_HOPS-й справа,
 * как в getClientIp). Без прокси — только адрес TCP-соединения: иначе любой
 * компьютер сети подставил бы заголовок и выдал себя за чужой компьютер.
 */

/** «::ffff:192.168.31.20» → «192.168.31.20», «::1» → «127.0.0.1» */
export function normalizeIp(ip: string | null | undefined): string {
  let value = String(ip || "").trim();
  if (!value) return "";
  if (value.startsWith("::ffff:")) value = value.slice(7);
  if (value === "::1") return "127.0.0.1";
  return value;
}

export function isLoopbackIp(ip: string): boolean {
  return ip.startsWith("127.") || ip === "::1";
}

/** Локальные сети: 10/8, 172.16/12, 192.168/16, 127/8, link-local, IPv6 ULA */
export function isPrivateIp(ip: string): boolean {
  if (isLoopbackIp(ip)) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  const m = /^172\.(\d+)\./.exec(ip);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  const lower = ip.toLowerCase();
  return lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
}

/**
 * @param remoteAddress адрес TCP-соединения
 * @param getHeaderValue доступ к заголовкам запроса
 */
export function resolveClientIp(
  remoteAddress: string | null | undefined,
  getHeaderValue: (name: string) => string | null | undefined,
): string {
  const remote = normalizeIp(remoteAddress);
  if (isLoopbackIp(remote)) {
    const hops = Math.max(0, parseInt(process.env.TRUST_PROXY_HOPS ?? "1", 10) || 0);
    const header = hops > 0 ? getHeaderValue("x-forwarded-for") : null;
    if (header) {
      const list = header.split(",").map((s) => s.trim()).filter(Boolean);
      const candidate = normalizeIp(list[list.length - hops]);
      if (candidate) return candidate;
    }
  }
  return remote;
}

export function getTestingRoomIp(event: H3Event): string {
  return resolveClientIp(event.node.req.socket?.remoteAddress, (name) => {
    const value = event.node.req.headers[name];
    return Array.isArray(value) ? value[0] : value;
  });
}

/** Сортировка IPv4 по числовому значению (192.168.31.2 < 192.168.31.10) */
export function compareIp(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  if (pa.length === 4 && pb.length === 4 && pa.every(Number.isFinite) && pb.every(Number.isFinite)) {
    for (let i = 0; i < 4; i++) {
      if (pa[i] !== pb[i]) return pa[i]! - pb[i]!;
    }
    return 0;
  }
  return a.localeCompare(b);
}
