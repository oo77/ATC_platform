/**
 * Класс тестирования: живые WebSocket-подключения компьютеров и администраторов.
 *
 * Каждая открытая вкладка платформы подключается к /_ws/testing-room и
 * сообщает, что на ней открыто (страница, кто вошёл). Сервер знает IP
 * соединения и по нему сопоставляет вкладку с компьютером класса.
 * Администратор (право tests:assign) подписывается на тот же канал и
 * получает список подключённых компьютеров в реальном времени.
 *
 * Состояние хранится в памяти процесса: после перезапуска вкладки
 * переподключаются сами (клиент держит соединение с повтором).
 */

import { createHash, randomBytes } from "node:crypto";
import { compareIp } from "./testingRoomIp";
import {
  getActiveSeatForWorkstation,
  getSeatDetailsById,
  getWorkstationByIp,
  setSeatTicket,
  type Workstation,
} from "../repositories/testingRoomRepository";

/** Минимум от crossws Peer, который нужен хабу */
export interface HubPeer {
  id: string;
  send(data: unknown): void;
}

export interface KioskState {
  path: string | null;
  userName: string | null;
  userRole: string | null;
}

interface KioskConnection extends KioskState {
  peer: HubPeer;
  ip: string;
  connectedAt: number;
  lastSeen: number;
}

export interface PresenceDevice {
  ip: string;
  /** Открытых вкладок с этого IP */
  connections: number;
  connectedAt: number;
  lastSeen: number;
  /** Состояние самой свежей вкладки */
  path: string | null;
  userName: string | null;
  userRole: string | null;
}

/**
 * Вкладка шлёт ping каждые 25 с (фоновая — не реже раза в минуту из-за
 * троттлинга таймеров). Молчит дольше — считаем отключённой (обрыв сети без close).
 */
const STALE_MS = 150 * 1000;

/** Сколько живёт билет на вход (компьютер гасит его за доли секунды) */
const TICKET_TTL_MS = 2 * 60 * 1000;

interface HubState {
  kiosks: Map<string, KioskConnection>;
  admins: Map<string, HubPeer>;
  presenceTimer: ReturnType<typeof setTimeout> | null;
}

// globalThis: в dev модуль перезагружается, а соединения живут дольше модуля
const g = globalThis as unknown as { __atcTestingRoomHub?: HubState };
const hub: HubState = (g.__atcTestingRoomHub ||= {
  kiosks: new Map(),
  admins: new Map(),
  presenceTimer: null,
});

function safeSend(peer: HubPeer, message: unknown) {
  try {
    peer.send(JSON.stringify(message));
  } catch (error) {
    console.warn("[TestingRoom] Не удалось отправить сообщение:", error);
  }
}

export function hashTicket(ticket: string): string {
  return createHash("sha256").update(ticket).digest("hex");
}

// ============================================================================
// ПОДКЛЮЧЕНИЯ
// ============================================================================

export function registerKiosk(peer: HubPeer, ip: string, state: Partial<KioskState>) {
  const now = Date.now();
  const existing = hub.kiosks.get(peer.id);
  hub.kiosks.set(peer.id, {
    peer,
    ip,
    connectedAt: existing?.connectedAt || now,
    lastSeen: now,
    path: state.path ?? null,
    userName: state.userName ?? null,
    userRole: state.userRole ?? null,
  });
  schedulePresenceBroadcast();
}

export function updateKioskState(peerId: string, state: Partial<KioskState>) {
  const kiosk = hub.kiosks.get(peerId);
  if (!kiosk) return;
  kiosk.lastSeen = Date.now();
  if (state.path !== undefined) kiosk.path = state.path;
  if (state.userName !== undefined) kiosk.userName = state.userName;
  if (state.userRole !== undefined) kiosk.userRole = state.userRole;
  schedulePresenceBroadcast();
}

export function touchPeer(peerId: string) {
  const kiosk = hub.kiosks.get(peerId);
  if (!kiosk) return;
  const wasStale = Date.now() - kiosk.lastSeen > STALE_MS;
  kiosk.lastSeen = Date.now();
  if (wasStale) schedulePresenceBroadcast();
}

export function getKioskIp(peerId: string): string | null {
  return hub.kiosks.get(peerId)?.ip || null;
}

/** Живые вкладки (давно молчащие не удаляем — оживут со следующим ping) */
function liveKiosks(): KioskConnection[] {
  const border = Date.now() - STALE_MS;
  return [...hub.kiosks.values()].filter((k) => k.lastSeen >= border);
}

export function registerAdmin(peer: HubPeer) {
  hub.admins.set(peer.id, peer);
  safeSend(peer, { type: "presence", devices: getPresence() });
}

export function removePeer(peerId: string) {
  const wasKiosk = hub.kiosks.delete(peerId);
  hub.admins.delete(peerId);
  if (wasKiosk) schedulePresenceBroadcast();
}

// ============================================================================
// ПРИСУТСТВИЕ
// ============================================================================

/** Подключённые устройства, сгруппированные по IP */
export function getPresence(): PresenceDevice[] {
  const byIp = new Map<string, PresenceDevice>();
  const freshest = new Map<string, number>();

  for (const k of liveKiosks()) {
    const device = byIp.get(k.ip);
    if (!device) {
      byIp.set(k.ip, {
        ip: k.ip,
        connections: 1,
        connectedAt: k.connectedAt,
        lastSeen: k.lastSeen,
        path: k.path,
        userName: k.userName,
        userRole: k.userRole,
      });
      freshest.set(k.ip, k.lastSeen);
      continue;
    }
    device.connections += 1;
    device.connectedAt = Math.min(device.connectedAt, k.connectedAt);
    device.lastSeen = Math.max(device.lastSeen, k.lastSeen);
    // Показываем вкладку, где кто-то вошёл, иначе самую свежую
    const better =
      (!device.userName && k.userName) ||
      (!!device.userName === !!k.userName && k.lastSeen > (freshest.get(k.ip) || 0));
    if (better) {
      device.path = k.path;
      device.userName = k.userName;
      device.userRole = k.userRole;
      freshest.set(k.ip, k.lastSeen);
    }
  }

  return [...byIp.values()].sort((a, b) => compareIp(a.ip, b.ip));
}

export function isIpOnline(ip: string): boolean {
  return liveKiosks().some((k) => k.ip === ip);
}

function schedulePresenceBroadcast() {
  if (hub.presenceTimer) return;
  hub.presenceTimer = setTimeout(() => {
    hub.presenceTimer = null;
    const message = { type: "presence", devices: getPresence() };
    for (const admin of hub.admins.values()) safeSend(admin, message);
  }, 250);
}

/** Сообщить администраторам, что посадки / результаты изменились */
export function notifyTestingRoomAdmins(extra: Record<string, unknown> = {}) {
  const message = { type: "seats-changed", ...extra };
  for (const admin of hub.admins.values()) safeSend(admin, message);
}

/** Отправить сообщение всем вкладкам компьютера; вернуть число вкладок */
export function sendToIp(ip: string, message: unknown): number {
  let count = 0;
  for (const k of hub.kiosks.values()) {
    if (k.ip === ip) {
      safeSend(k.peer, message);
      count++;
    }
  }
  return count;
}

export function stationInfo(workstation: Workstation | null) {
  return workstation
    ? { id: workstation.id, number: workstation.number, name: workstation.name }
    : null;
}

// ============================================================================
// ВХОД В ТЕСТ
// ============================================================================

/**
 * Если за компьютером ждёт посадка — выдать новый одноразовый билет
 * и отправить его на все вкладки компьютера. Возвращает true, если отправлено.
 */
export async function deliverPendingSeat(workstation: Workstation): Promise<boolean> {
  if (!workstation.isActive || !isIpOnline(workstation.ipAddress)) return false;

  const seat = await getActiveSeatForWorkstation(workstation.id);
  if (!seat || seat.status !== "pending") return false;

  const details = await getSeatDetailsById(seat.id);
  const ticket = randomBytes(32).toString("base64url");
  const stored = await setSeatTicket(seat.id, hashTicket(ticket), new Date(Date.now() + TICKET_TTL_MS));
  if (!stored) return false;

  const sent = sendToIp(workstation.ipAddress, {
    type: "launch",
    ticket,
    seatId: seat.id,
    studentName: details?.studentName || "",
    testName: details?.templateName || "",
  });
  return sent > 0;
}

/** Вкладка компьютера подключилась: рассказать ей, какой это компьютер, и отдать ожидающий вход */
export async function onKioskHello(peer: HubPeer, ip: string) {
  // IP — сразу (без БД), название компьютера — следующим сообщением
  safeSend(peer, { type: "welcome", ip });
  let workstation: Workstation | null = null;
  try {
    workstation = await getWorkstationByIp(ip);
  } catch (error) {
    console.warn("[TestingRoom] Не удалось найти компьютер по IP:", error);
    return;
  }
  safeSend(peer, { type: "welcome", ip, station: stationInfo(workstation) });
  if (workstation) {
    try {
      await deliverPendingSeat(workstation);
    } catch (error) {
      console.error("[TestingRoom] Ошибка отправки входа:", error);
    }
  }
}

/** Обновить у вкладок компьютера его название/номер (после правки в админке) */
export function pushStationInfo(ip: string, workstation: Workstation | null) {
  sendToIp(ip, { type: "welcome", ip, station: stationInfo(workstation) });
}
