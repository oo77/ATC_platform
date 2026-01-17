/**
 * Утилита для логирования с поддержкой production режима
 * 
 * Использование:
 * import { logger } from '~/server/utils/logger'
 * 
 * logger.info('Информационное сообщение')
 * logger.warn('Предупреждение')
 * logger.error('Ошибка', error)
 * logger.debug('Отладочная информация')
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

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
     * Логирование запросов API (только в development)
     */
    request: (method: string, path: string, ...args: any[]) => {
        if (isDevelopment) {
            console.log(`[${method}]`, path, ...args)
        }
    },

    /**
     * Логирование ответов API (только в development)
     */
    response: (method: string, path: string, status: number, ...args: any[]) => {
        if (isDevelopment) {
            console.log(`[${method}]`, path, `[${status}]`, ...args)
        }
    }
}

/**
 * Хелпер для логирования в production
 * Можно использовать для критичных логов, которые нужны в production
 */
export const productionLogger = {
    critical: (...args: any[]) => {
        console.error('[CRITICAL]', new Date().toISOString(), ...args)
    },

    security: (...args: any[]) => {
        console.warn('[SECURITY]', new Date().toISOString(), ...args)
    },

    audit: (...args: any[]) => {
        console.log('[AUDIT]', new Date().toISOString(), ...args)
    }
}
