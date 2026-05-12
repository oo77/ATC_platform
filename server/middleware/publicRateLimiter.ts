/**
 * Rate Limiting middleware для публичных endpoints верификации сертификатов
 *
 * Применяется ТОЛЬКО к:
 *   GET /api/certificates/verify/:number
 *   GET /api/public/*
 *
 * Лимит: 20 запросов/минуту с одного IP.
 * При превышении — 429 Too Many Requests с заголовками Retry-After.
 */

interface RateLimitBucket {
  timestamps: number[];
  blockedUntil: number | null;
}

// In-memory хранилище (сбрасывается при перезапуске — для публичного verify достаточно)
const buckets = new Map<string, RateLimitBucket>();

const MAX_REQUESTS = 20;    // запросов
const WINDOW_MS   = 60_000; // за 1 минуту
const BLOCK_MS    = 5 * 60_000; // блокировка 5 минут при превышении

// Автоочистка старых записей каждые 10 минут
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    const isUnblocked = !bucket.blockedUntil || now > bucket.blockedUntil;
    const isInactive  = bucket.timestamps.every(t => now - t > WINDOW_MS);
    if (isUnblocked && isInactive) {
      buckets.delete(key);
    }
  }
}, 10 * 60_000);

// Предотвращаем утечку в тесты/SSR
if (typeof process !== "undefined") {
  process.on("beforeExit", () => clearInterval(cleanupInterval));
}

/** Маршруты, к которым применяется rate limiting */
const RATE_LIMITED_PATHS = [
  "/api/certificates/verify/",
  "/api/public/",
];

function isRateLimitedPath(path: string): boolean {
  return RATE_LIMITED_PATHS.some(p => path.startsWith(p));
}

function getClientIp(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never): string {
  return (
    getRequestIP(event, { xForwardedFor: true }) ??
    "unknown"
  );
}

export default defineEventHandler((event) => {
  const path = event.path;

  // Только API и только rate-limited пути
  if (!path.startsWith("/api") || !isRateLimitedPath(path)) {
    return;
  }

  const ip  = getClientIp(event);
  const now = Date.now();
  const key = ip;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [], blockedUntil: null };
    buckets.set(key, bucket);
  }

  // Проверяем, заблокирован ли IP
  if (bucket.blockedUntil && now < bucket.blockedUntil) {
    const retryAfter = Math.ceil((bucket.blockedUntil - now) / 1000);
    setHeader(event, "Retry-After", retryAfter);
    setHeader(event, "X-RateLimit-Limit", MAX_REQUESTS);
    setHeader(event, "X-RateLimit-Remaining", 0);

    console.warn(
      `[PublicRateLimit] BLOCKED ip=${ip} path=${path} retryAfter=${retryAfter}s`,
    );

    throw createError({
      statusCode: 429,
      message: "Слишком много запросов. Пожалуйста, подождите несколько минут.",
    });
  }

  // Очищаем устаревшие временные метки
  bucket.timestamps = bucket.timestamps.filter(t => now - t < WINDOW_MS);

  // Проверяем лимит
  if (bucket.timestamps.length >= MAX_REQUESTS) {
    bucket.blockedUntil = now + BLOCK_MS;

    const retryAfter = Math.ceil(BLOCK_MS / 1000);
    setHeader(event, "Retry-After", retryAfter);
    setHeader(event, "X-RateLimit-Limit", MAX_REQUESTS);
    setHeader(event, "X-RateLimit-Remaining", 0);

    console.warn(
      `[PublicRateLimit] LIMIT EXCEEDED ip=${ip} path=${path} — blocking for ${retryAfter}s`,
    );

    throw createError({
      statusCode: 429,
      message: "Слишком много запросов. Пожалуйста, подождите несколько минут.",
    });
  }

  // Фиксируем запрос
  bucket.timestamps.push(now);

  const remaining = MAX_REQUESTS - bucket.timestamps.length;
  setHeader(event, "X-RateLimit-Limit", MAX_REQUESTS);
  setHeader(event, "X-RateLimit-Remaining", remaining);
  setHeader(event, "X-RateLimit-Reset", Math.ceil((now + WINDOW_MS) / 1000));
});
