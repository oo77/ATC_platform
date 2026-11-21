/**
 * Класс тестирования на стороне компьютера: какой это компьютер, есть ли связь,
 * что сейчас показать поверх страницы (номер компьютера, вход в тест).
 * Состояние наполняет плагин testing-room.client.ts.
 */

export interface TestingRoomStation {
  id: string;
  number: number;
  name: string;
}

export interface TestingRoomLaunch {
  studentName: string;
  testName: string;
  error: string | null;
}

const KIOSK_FLAG = "atc:testing-room-kiosk";

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

export const useTestingRoom = () => {
  const station = useState<TestingRoomStation | null>("testing-room:station", () => null);
  const ip = useState<string | null>("testing-room:ip", () => null);
  const connected = useState<boolean>("testing-room:connected", () => false);
  const identify = useState<{ number: number; name: string } | null>("testing-room:identify", () => null);
  const launch = useState<TestingRoomLaunch | null>("testing-room:launch", () => null);

  /** Вкладка открыта входом с компьютера класса (после теста — назад к ожиданию) */
  const isKioskSession = () => {
    try {
      return sessionStorage.getItem(KIOSK_FLAG) === "1";
    } catch {
      return false;
    }
  };

  /** Сохранить вход слушателя (полная перезагрузка страницы подхватит его из cookie) */
  const applyKioskLogin = (tokens: { token: string; refreshToken?: string }) => {
    writeCookie("auth_token", tokens.token, 60 * 60 * 24 * 7);
    if (tokens.refreshToken) writeCookie("auth_refresh_token", tokens.refreshToken, 60 * 60 * 24 * 30);
    try {
      sessionStorage.setItem(KIOSK_FLAG, "1");
    } catch {
      /* приватный режим — не критично */
    }
  };

  /** Выйти из учётной записи слушателя и вернуть компьютер к ожиданию */
  const exitToWaiting = async () => {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* выход должен сработать и без сети */
    }
    writeCookie("auth_token", "", 0);
    writeCookie("auth_refresh_token", "", 0);
    try {
      sessionStorage.removeItem(KIOSK_FLAG);
    } catch {
      /* ничего */
    }
    window.location.replace("/testing/kiosk");
  };

  return { station, ip, connected, identify, launch, isKioskSession, applyKioskLogin, exitToWaiting };
};
