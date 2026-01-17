/**
 * In-memory кэш для Telegram-бота
 * Оптимизирует производительность за счет кэширования часто запрашиваемых данных
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

class BotCache {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultTTL = 5 * 60 * 1000; // 5 минут
    private stats = {
        hits: 0,
        misses: 0,
    };

    /**
     * Сохранить данные в кэш
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + (ttl || this.defaultTTL),
        });
    }

    /**
     * Получить данные из кэша
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Проверяем срок действия
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.data as T;
    }

    /**
     * Получить или установить значение
     * Если значение есть в кэше - вернуть его
     * Если нет - выполнить функцию и закэшировать результат
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const data = await fetchFn();
        this.set(key, data, ttl);
        return data;
    }

    /**
     * Инвалидировать кэш по паттерну
     * Например: invalidate('students:') удалит все ключи, содержащие 'students:'
     */
    invalidate(pattern: string): number {
        let deleted = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                deleted++;
            }
        }
        console.log(`[BotCache] Инвалидировано ${deleted} записей по паттерну: ${pattern}`);
        return deleted;
    }

    /**
     * Удалить конкретный ключ
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Очистить весь кэш
     */
    clear(): void {
        this.cache.clear();
        this.stats.hits = 0;
        this.stats.misses = 0;
        console.log('[BotCache] Кэш полностью очищен');
    }

    /**
     * Автоматическая очистка устаревших записей
     */
    cleanup(): number {
        const now = Date.now();
        let deleted = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                deleted++;
            }
        }

        if (deleted > 0) {
            console.log(`[BotCache] Очищено ${deleted} устаревших записей`);
        }

        return deleted;
    }

    /**
     * Получить статистику кэша
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
        };
    }

    /**
     * Проверить наличие ключа
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Получить все ключи (для отладки)
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Получить размер кэша
     */
    size(): number {
        return this.cache.size;
    }
}

// Создаем singleton экземпляр
export const botCache = new BotCache();

// Запускаем автоматическую очистку каждые 10 минут
const cleanupInterval = setInterval(() => {
    botCache.cleanup();
}, 10 * 60 * 1000);

// Очистка при завершении процесса
if (typeof process !== 'undefined') {
    process.on('beforeExit', () => {
        clearInterval(cleanupInterval);
        botCache.clear();
    });
}

/**
 * Хелперы для создания ключей кэша
 */
export const CacheKeys = {
    students: (organizationId: string, courseId?: string) =>
        `students:${organizationId}${courseId ? `:${courseId}` : ''}`,

    schedule: (organizationId: string, startDate?: string, endDate?: string) =>
        `schedule:${organizationId}${startDate ? `:${startDate}` : ''}${endDate ? `:${endDate}` : ''}`,

    certificates: (organizationId: string, period?: string) =>
        `certificates:${organizationId}${period ? `:${period}` : ''}`,

    representative: (chatId: string) =>
        `representative:${chatId}`,

    organization: (organizationId: string) =>
        `organization:${organizationId}`,
};

/**
 * Функция для инвалидации кэша при изменении данных
 */
export function invalidateRelatedCache(entityType: string, entityId?: string) {
    switch (entityType) {
        case 'student':
            botCache.invalidate('students:');
            break;

        case 'schedule':
        case 'event':
            botCache.invalidate('schedule:');
            break;

        case 'certificate':
            botCache.invalidate('certificates:');
            break;

        case 'organization':
            if (entityId) {
                botCache.invalidate(`students:${entityId}`);
                botCache.invalidate(`schedule:${entityId}`);
                botCache.invalidate(`certificates:${entityId}`);
                botCache.invalidate(`organization:${entityId}`);
            }
            break;

        case 'representative':
            if (entityId) {
                botCache.invalidate(`representative:${entityId}`);
            }
            break;

        default:
            console.warn(`[BotCache] Неизвестный тип сущности для инвалидации: ${entityType}`);
    }
}

/**
 * Логирование статистики кэша (для мониторинга)
 */
export function logCacheStats() {
    const stats = botCache.getStats();
    console.log('[BotCache] Статистика:', {
        hits: stats.hits,
        misses: stats.misses,
        size: stats.size,
        hitRate: `${stats.hitRate.toFixed(2)}%`,
    });
}

// Логируем статистику каждый час
setInterval(() => {
    logCacheStats();
}, 60 * 60 * 1000);
