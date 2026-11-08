/**
 * $fetch для Telegram Mini App.
 *
 * Прикладывает к каждому запросу подписанный Telegram initData в заголовке
 * X-Telegram-Init-Data. Сервер (server/utils/tgAppAuth.ts) проверяет подпись
 * и сам определяет представителя и организацию — без этого заголовка
 * эндпоинты /api/tg-app/* отвечают 401.
 */
export function useTgFetch() {
  return <T = any>(url: string, options: Record<string, any> = {}): Promise<T> => {
    const initData =
      (typeof window !== "undefined" &&
        (window as any).Telegram?.WebApp?.initData) ||
      "";

    return ($fetch as any)(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "X-Telegram-Init-Data": initData,
      },
    }) as Promise<T>;
  };
}
