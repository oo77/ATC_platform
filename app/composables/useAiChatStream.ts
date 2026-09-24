import { useCookie } from "#app";
import type { AiAgentStep, AiSendResult } from "~/types/aiChat";

export interface AiSendBody {
  sessionId?: string | null;
  message: string;
  fileAttachmentUuid?: string;
  settingId?: string;
  model?: string;
  effort?: "low" | "medium" | "high";
}

export interface AiStreamHandlers {
  onStatus?: (text: string) => void;
  onStep?: (step: AiAgentStep) => void;
  onSession?: (s: { sessionId: string; sessionTitle: string }) => void;
}

function abortError() {
  const e = new Error("Запрос остановлен");
  e.name = "AbortError";
  return e;
}

/** Ошибка от остановки запроса пользователем — её не нужно показывать как сбой */
export function isAbortError(err: any): boolean {
  return err?.name === "AbortError" || err?.cause?.name === "AbortError";
}

/**
 * Отправка сообщения ИИ-ассистенту с потоковым прогрессом (SSE):
 * интерфейс сразу показывает этапы работы агента, а не «висит» до конца.
 * Если поток недоступен — обычный JSON-запрос.
 */
export const useAiChatStream = () => {
  const token = useCookie("auth_token");
  const { authFetch } = useAuthFetch();

  async function sendAiMessage(
    body: AiSendBody,
    handlers: AiStreamHandlers = {},
    signal?: AbortSignal,
  ): Promise<AiSendResult> {
    let response: Response | null = null;
    try {
      response = await fetch("/api/ai/chat/message", {
        method: "POST",
        signal,
        headers: {
          Authorization: token.value ? `Bearer ${token.value}` : "",
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (signal?.aborted) throw abortError();
      response = null;
    }

    if (!response || !response.ok || !response.body) {
      if (response && response.status >= 400 && response.status < 500 && response.status !== 401) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Ошибка сервера (${response.status})`);
      }
      const res: any = await authFetch("/api/ai/chat/message", { method: "POST", body, signal });
      if (!res?.success) throw new Error(res?.message || "Ошибка генерации ответа");
      return res.data;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result: AiSendResult | null = null;

    const onAbort = () => reader.cancel().catch(() => {});
    signal?.addEventListener("abort", onAbort, { once: true });

    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err) {
        if (signal?.aborted) throw abortError();
        throw err;
      }
      if (signal?.aborted) throw abortError();
      const { done, value } = chunk;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        let name = "message";
        let raw = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event: ")) name = line.slice(7).trim();
          else if (line.startsWith("data: ")) raw += line.slice(6);
        }
        if (!raw) continue;
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          continue;
        }
        if (name === "status") handlers.onStatus?.(data.message);
        else if (name === "step") handlers.onStep?.(data);
        else if (name === "session") handlers.onSession?.(data);
        else if (name === "result") result = data;
        else if (name === "error") throw new Error(data.message || "Ошибка генерации ответа");
      }
    }

    signal?.removeEventListener("abort", onAbort);
    if (signal?.aborted) throw abortError();
    if (!result) throw new Error("Соединение прервано до получения ответа");
    return result;
  }

  return { sendAiMessage, isAbortError };
};
