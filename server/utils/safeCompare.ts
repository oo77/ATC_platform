import { timingSafeEqual } from "crypto";

/** Сравнение секретов за постоянное время (не даёт подбирать токен по времени ответа) */
export function safeEqual(a: unknown, b: unknown): boolean {
  const bufA = Buffer.from(String(a ?? ""));
  const bufB = Buffer.from(String(b ?? ""));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
