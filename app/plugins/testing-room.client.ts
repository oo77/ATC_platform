/**
 * Класс тестирования: каждая вкладка платформы держит WebSocket с сервером.
 *
 * Сервер видит IP компьютера и показывает его администратору на экране
 * «Проведение тестирования» вместе с тем, кто сейчас вошёл. Когда
 * администратор сажает слушателя за этот компьютер, сюда приходит
 * одноразовый билет — вкладка сама входит под слушателем и открывает тест.
 */

const SKIP_PREFIXES = ["/tg-app", "/d/", "/verify"];
const PING_MS = 25_000;

export default defineNuxtPlugin(() => {
  const router = useRouter();
  const user = useState<any>("auth:user");
  const room = useTestingRoom();

  // Telegram Mini App и публичные страницы по ссылке — не компьютеры класса
  const firstPath = router.currentRoute.value.path;
  if (SKIP_PREFIXES.some((p) => firstPath.startsWith(p))) return;

  let ws: WebSocket | null = null;
  let retry = 0;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let identifyTimer: ReturnType<typeof setTimeout> | null = null;
  let launching = false;

  const currentState = () => ({
    path: router.currentRoute.value.path,
    userName: user.value?.name || null,
    userRole: user.value?.role || null,
  });

  const send = (message: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  };

  const handleLaunch = async (msg: any) => {
    if (launching) return;
    // На компьютере работает сотрудник — не выкидываем его из системы
    if (user.value && user.value.role !== "STUDENT") {
      send({ type: "launch-declined", seatId: msg.seatId, reason: `вошёл ${user.value.name}` });
      return;
    }
    launching = true;
    room.launch.value = { studentName: msg.studentName, testName: msg.testName, error: null };
    try {
      const res = await $fetch<any>("/api/testing-room/claim", {
        method: "POST",
        body: { ticket: msg.ticket },
      });
      room.applyKioskLogin(res);
      window.location.replace(`/tests/take/${res.sessionId}`);
    } catch (error: any) {
      // 409: вход уже выполнила другая вкладка этого компьютера
      if (error?.statusCode === 409) {
        room.launch.value = null;
        launching = false;
        return;
      }
      room.launch.value = {
        studentName: msg.studentName,
        testName: msg.testName,
        error: error?.data?.message || error?.message || "Не удалось войти в тест",
      };
      launching = false;
      setTimeout(() => {
        if (!launching) room.launch.value = null;
      }, 8000);
    }
  };

  const handleRelease = () => {
    // Освобождение касается только слушателя или пустого компьютера
    if (user.value && user.value.role !== "STUDENT") return;
    const path = router.currentRoute.value.path;
    if (!user.value && path.startsWith("/testing/kiosk")) return;
    room.exitToWaiting();
  };

  const onMessage = (event: MessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(String(event.data));
    } catch {
      return;
    }
    switch (msg?.type) {
      case "welcome":
        room.ip.value = msg.ip || null;
        if ("station" in msg) room.station.value = msg.station || null;
        break;
      case "launch":
        handleLaunch(msg);
        break;
      case "release":
        handleRelease();
        break;
      case "identify":
        room.identify.value = { number: msg.number, name: msg.name };
        if (identifyTimer) clearTimeout(identifyTimer);
        identifyTimer = setTimeout(() => (room.identify.value = null), 6000);
        break;
    }
  };

  const connect = () => {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    try {
      ws = new WebSocket(`${protocol}://${window.location.host}/_ws/testing-room`);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      retry = 0;
      room.connected.value = true;
      send({ type: "hello", state: currentState() });
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = setInterval(() => send({ type: "ping" }), PING_MS);
    };
    ws.onmessage = onMessage;
    ws.onclose = () => {
      room.connected.value = false;
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = null;
      scheduleReconnect();
    };
    ws.onerror = () => ws?.close();
  };

  const scheduleReconnect = () => {
    retry = Math.min(retry + 1, 6);
    // 1, 2, 4, 8, 15, 15 … секунд + немного случайности, чтобы 20 компьютеров не ломились разом
    const delay = Math.min(1000 * 2 ** (retry - 1), 15_000) + Math.random() * 1000;
    setTimeout(connect, delay);
  };

  // Сообщаем, что открыто на компьютере (страница, кто вошёл)
  watch(
    () => [router.currentRoute.value.path, user.value?.id, user.value?.name],
    () => send({ type: "state", state: currentState() }),
  );

  // Вкладка проснулась (ноутбук открыли) — проверить связь сразу
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ws?.readyState === WebSocket.CLOSED) {
      retry = 0;
      connect();
    }
  });

  connect();
});
