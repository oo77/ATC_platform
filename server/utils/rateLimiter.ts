/**
 * Rate Limiter для Telegram-бота
 * Защита от спама и злоупотреблений
 */

interface RateLimitEntry {
    requests: number[];
    blocked: boolean;
    blockedUntil?: number;
    warningsSent: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt?: Date;
    isWarning?: boolean;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    blockDurationMs: number;
    warningThreshold: number;
}

class RateLimiter {
    private limits = new Map<string, RateLimitEntry>();
    private config: RateLimitConfig;

    constructor(config?: Partial<RateLimitConfig>) {
        this.config = {
            maxRequests: config?.maxRequests || 10, // 10 запросов
            windowMs: config?.windowMs || 60 * 1000, // за 1 минуту
            blockDurationMs: config?.blockDurationMs || 5 * 60 * 1000, // блокировка на 5 минут
            warningThreshold: config?.warningThreshold || 8, // предупреждение при 8 запросах
        };
    }

    /**
     * Проверить лимит для пользователя
     */
    check(chatId: string): RateLimitResult {
        const now = Date.now();
        let entry = this.limits.get(chatId);

        if (!entry) {
            entry = {
                requests: [],
                blocked: false,
                warningsSent: 0,
            };
            this.limits.set(chatId, entry);
        }

        // Проверяем блокировку
        if (entry.blocked && entry.blockedUntil) {
            if (now < entry.blockedUntil) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: new Date(entry.blockedUntil),
                };
            } else {
                // Снимаем блокировку
                entry.blocked = false;
                entry.blockedUntil = undefined;
                entry.requests = [];
                entry.warningsSent = 0;
                console.log(`[RateLimiter] Блокировка снята для chatId: ${chatId}`);
            }
        }

        // Удаляем старые запросы (вне окна)
        entry.requests = entry.requests.filter(time => now - time < this.config.windowMs);

        // Проверяем лимит
        if (entry.requests.length >= this.config.maxRequests) {
            entry.blocked = true;
            entry.blockedUntil = now + this.config.blockDurationMs;

            console.warn(`[RateLimiter] Пользователь заблокирован за спам: ${chatId}`, {
                requests: entry.requests.length,
                blockedUntil: new Date(entry.blockedUntil).toISOString(),
            });

            return {
                allowed: false,
                remaining: 0,
                resetAt: new Date(entry.blockedUntil),
            };
        }

        // Добавляем текущий запрос
        entry.requests.push(now);

        const remaining = this.config.maxRequests - entry.requests.length;
        const isWarning = entry.requests.length >= this.config.warningThreshold;

        // Отправляем предупреждение только один раз
        if (isWarning && entry.warningsSent === 0) {
            entry.warningsSent++;
            console.log(`[RateLimiter] Предупреждение для chatId: ${chatId} (${entry.requests.length}/${this.config.maxRequests})`);
        }

        return {
            allowed: true,
            remaining,
            isWarning: isWarning && entry.warningsSent === 1,
        };
    }

    /**
     * Сбросить лимит для пользователя (например, для админов)
     */
    reset(chatId: string): void {
        this.limits.delete(chatId);
        console.log(`[RateLimiter] Лимит сброшен для chatId: ${chatId}`);
    }

    /**
     * Проверить, заблокирован ли пользователь
     */
    isBlocked(chatId: string): boolean {
        const entry = this.limits.get(chatId);
        if (!entry || !entry.blocked) return false;

        if (entry.blockedUntil && Date.now() < entry.blockedUntil) {
            return true;
        }

        return false;
    }

    /**
     * Получить информацию о лимитах пользователя
     */
    getInfo(chatId: string): {
        requests: number;
        remaining: number;
        blocked: boolean;
        blockedUntil?: Date;
    } {
        const now = Date.now();
        const entry = this.limits.get(chatId);

        if (!entry) {
            return {
                requests: 0,
                remaining: this.config.maxRequests,
                blocked: false,
            };
        }

        // Очищаем старые запросы
        const recentRequests = entry.requests.filter(
            time => now - time < this.config.windowMs
        );

        return {
            requests: recentRequests.length,
            remaining: this.config.maxRequests - recentRequests.length,
            blocked: entry.blocked || false,
            blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : undefined,
        };
    }

    /**
     * Очистить старые записи
     */
    cleanup(): number {
        const now = Date.now();
        let deleted = 0;

        for (const [chatId, entry] of this.limits.entries()) {
            // Удаляем записи, которые не активны более часа
            const lastRequest = entry.requests[entry.requests.length - 1] || 0;
            const isInactive = now - lastRequest > 60 * 60 * 1000; // 1 час
            const isNotBlocked = !entry.blocked || (entry.blockedUntil && now > entry.blockedUntil);

            if (isInactive && isNotBlocked) {
                this.limits.delete(chatId);
                deleted++;
            }
        }

        if (deleted > 0) {
            console.log(`[RateLimiter] Очищено ${deleted} неактивных записей`);
        }

        return deleted;
    }

    /**
     * Получить статистику
     */
    getStats(): {
        totalUsers: number;
        blockedUsers: number;
        activeUsers: number;
    } {
        const now = Date.now();
        let blockedUsers = 0;
        let activeUsers = 0;

        for (const entry of this.limits.values()) {
            if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
                blockedUsers++;
            }

            const recentRequests = entry.requests.filter(
                time => now - time < this.config.windowMs
            );
            if (recentRequests.length > 0) {
                activeUsers++;
            }
        }

        return {
            totalUsers: this.limits.size,
            blockedUsers,
            activeUsers,
        };
    }

    /**
     * Получить конфигурацию
     */
    getConfig(): RateLimitConfig {
        return { ...this.config };
    }

    /**
     * Обновить конфигурацию
     */
    updateConfig(config: Partial<RateLimitConfig>): void {
        this.config = { ...this.config, ...config };
        console.log('[RateLimiter] Конфигурация обновлена:', this.config);
    }
}

// Создаем singleton экземпляр
export const rateLimiter = new RateLimiter();

// Запускаем автоматическую очистку каждые 30 минут
const cleanupInterval = setInterval(() => {
    rateLimiter.cleanup();
}, 30 * 60 * 1000);

// Очистка при завершении процесса
if (typeof process !== 'undefined') {
    process.on('beforeExit', () => {
        clearInterval(cleanupInterval);
    });
}

/**
 * Форматирование времени до разблокировки
 */
export function formatBlockDuration(resetAt?: Date): string {
    if (!resetAt) return '';

    const now = Date.now();
    const diff = resetAt.getTime() - now;

    if (diff <= 0) return 'сейчас';

    const minutes = Math.ceil(diff / (60 * 1000));

    if (minutes < 60) {
        return `${minutes} ${getMinutesWord(minutes)}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} ${getHoursWord(hours)}`;
    }

    return `${hours} ${getHoursWord(hours)} ${remainingMinutes} ${getMinutesWord(remainingMinutes)}`;
}

function getMinutesWord(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'минуту';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'минуты';
    return 'минут';
}

function getHoursWord(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'час';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'часа';
    return 'часов';
}

/**
 * Логирование статистики rate limiter
 */
export function logRateLimiterStats() {
    const stats = rateLimiter.getStats();
    console.log('[RateLimiter] Статистика:', stats);
}

// Логируем статистику каждый час
setInterval(() => {
    logRateLimiterStats();
}, 60 * 60 * 1000);
