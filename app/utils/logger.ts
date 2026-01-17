/**
 * Утилита для логирования на клиенте с поддержкой production режима
 * 
 * Использование:
 * import { logger } from '~/utils/logger'
 * 
 * logger.info('Информационное сообщение')
 * logger.warn('Предупреждение')
 * logger.error('Ошибка', error)
 * logger.debug('Отладочная информация')
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
    /**
     * Информационное сообщение (показывается всегда)
     */
    info: (...args: any[]) => {
        console.log('[INFO]', ...args)
    },

    /**
     * Предупреждение (показывается всегда)
     */
    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args)
    },

    /**
     * Ошибка (показывается всегда)
     */
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args)
    },

    /**
     * Отладочная информация (только в development)
     */
    debug: (...args: any[]) => {
        if (isDevelopment) {
            console.log('[DEBUG]', ...args)
        }
    },

    /**
     * Успешное выполнение (только в development)
     */
    success: (...args: any[]) => {
        if (isDevelopment) {
            console.log('[SUCCESS]', ...args)
        }
    },

    /**
     * Логирование событий UI (только в development)
     */
    ui: (event: string, ...args: any[]) => {
        if (isDevelopment) {
            console.log(`[UI:${event}]`, ...args)
        }
    },

    /**
     * Логирование API вызовов (только в development)
     */
    api: (method: string, endpoint: string, ...args: any[]) => {
        if (isDevelopment) {
            console.log(`[API:${method}]`, endpoint, ...args)
        }
    }
}
