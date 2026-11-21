/**
 * WebSocket класса тестирования: /_ws/testing-room
 *
 * Клиент → сервер:
 *   { type: "hello", state }            вкладка платформы (компьютер) подключилась
 *   { type: "state", state }            сменилась страница / вошёл-вышел пользователь
 *   { type: "launch-declined", ... }   на компьютере вошёл сотрудник, вход отклонён
 *   { type: "admin-subscribe", token }  экран «Проведение тестирования»
 *   { type: "ping" }
 * Сервер → клиент:
 *   { type: "welcome", ip, station }    какой это компьютер (null — не зарегистрирован)
 *   { type: "launch", ticket, ... }     войти под слушателем и открыть тест
 *   { type: "release" }                 выйти и вернуться к ожиданию
 *   { type: "identify", number, name }  показать номер компьютера на экране
 *   { type: "presence", devices }       (админ) подключённые компьютеры
 *   { type: "seats-changed" }           (админ) посадки / результаты изменились
 */

import { resolveClientIp } from "../../utils/testingRoomIp";
import {
  getKioskIp,
  notifyTestingRoomAdmins,
  onKioskHello,
  registerAdmin,
  registerKiosk,
  removePeer,
  touchPeer,
  updateKioskState,
  type KioskState,
} from "../../utils/testingRoomHub";
import { verifyToken } from "../../utils/auth";
import { getUserAccess } from "../../utils/roleRegistry";
import { Permission, roleHasPermission } from "../../utils/permissions";

function peerIp(peer: any): string {
  let headers: any = null;
  try {
    headers = peer.request?.headers;
  } catch {
    headers = null;
  }
  return resolveClientIp(peer.remoteAddress, (name) => {
    if (!headers) return null;
    if (typeof headers.get === "function") return headers.get(name);
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  });
}

function cleanState(raw: any): Partial<KioskState> {
  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  return {
    path: str(raw?.path, 300),
    userName: str(raw?.userName, 200),
    userRole: str(raw?.userRole, 40),
  };
}

export default defineWebSocketHandler({
  async message(peer, message) {
    let data: any;
    try {
      data = JSON.parse(message.text());
    } catch {
      return;
    }
    if (!data || typeof data.type !== "string") return;

    switch (data.type) {
      case "hello": {
        const ip = peerIp(peer);
        if (!ip) return;
        registerKiosk(peer, ip, cleanState(data.state));
        await onKioskHello(peer, ip);
        return;
      }
      case "state":
        updateKioskState(peer.id, cleanState(data.state));
        return;
      case "ping":
        touchPeer(peer.id);
        peer.send(JSON.stringify({ type: "pong" }));
        return;
      case "launch-declined": {
        // На компьютере работает сотрудник — вход слушателя не выполнен
        const reason = typeof data.reason === "string" ? data.reason.slice(0, 200) : "";
        notifyTestingRoomAdmins({
          error: {
            seatId: typeof data.seatId === "string" ? data.seatId : null,
            message: `Компьютер ${getKioskIp(peer.id) || ""} занят (${reason}) — слушатель не вошёл. Попросите выйти из системы на этом компьютере.`,
          },
        });
        return;
      }
      case "admin-subscribe": {
        const payload = typeof data.token === "string" ? verifyToken(data.token) : null;
        const access = payload ? await getUserAccess(payload.userId) : null;
        if (!access || !roleHasPermission(access, Permission.TESTS_ASSIGN)) {
          peer.send(JSON.stringify({ type: "error", message: "Нет доступа" }));
          return;
        }
        registerAdmin(peer);
        return;
      }
    }
  },

  close(peer) {
    removePeer(peer.id);
  },

  error(peer) {
    removePeer(peer.id);
  },
});
