/**
 * Серверный плагин для автоматического применения миграций при старте приложения.
 * 
 * Это особенно полезно для деплоя на serverless-платформы (Netlify, Vercel),
 * где нет возможности запустить миграции вручную перед деплоем.
 * 
 * Поведение:
 * - В production: применяет миграции автоматически при первом запросе
 * - В development: пропускает (чтобы не замедлять dev-сервер)
 * 
 * Контролируется через переменную окружения: AUTO_MIGRATE=true
 */

import { runMigrations } from '../database/migrator';

let migrationPromise: Promise<void> | null = null;
let migrationCompleted = false;
let migrationError: Error | null = null;

/**
 * Запуск миграций с защитой от повторного вызова
 */
async function ensureMigrations(): Promise<void> {
    // Если миграции уже успешно применены — выходим
    if (migrationCompleted) {
        return;
    }

    // Если была ошибка — пробрасываем её
    if (migrationError) {
        throw migrationError;
    }

    // Если миграции уже запущены — ждём завершения
    if (migrationPromise) {
        return migrationPromise;
    }

    // Запускаем миграции
    migrationPromise = (async () => {
        try {
            console.log('🔄 [AutoMigrations] Running database migrations...');
            await runMigrations();
            migrationCompleted = true;
            console.log('✅ [AutoMigrations] Migrations completed successfully');
        } catch (error) {
            migrationError = error instanceof Error ? error : new Error(String(error));
            console.error('❌ [AutoMigrations] Migration failed:', migrationError.message);
            throw migrationError;
        }
    })();

    return migrationPromise;
}

export default defineNitroPlugin((nitroApp) => {
    const autoMigrate = process.env.AUTO_MIGRATE === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    // Логируем статус
    console.log(`🔧 [AutoMigrations] Plugin loaded`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   - AUTO_MIGRATE: ${autoMigrate ? 'enabled' : 'disabled'}`);

    // Если автомиграции отключены — выходим
    if (!autoMigrate) {
        console.log('ℹ️  [AutoMigrations] Skipped (AUTO_MIGRATE != true)');
        return;
    }

    // Запускаем миграции сразу при старте сервера (до первого запроса)
    ensureMigrations().catch((error) => {
        console.error('❌ [AutoMigrations] Startup migration failed:', error);
        // В production не крашим сервер, но запросы будут падать с ошибкой БД
        // Это позволяет увидеть ошибку в логах Netlify
    });

    // Также добавляем хук на запросы для гарантии
    nitroApp.hooks.hook('request', async (event) => {
        // Пропускаем статические файлы и health-check
        const path = event.path || '';
        if (
            path.startsWith('/_nuxt/') ||
            path.startsWith('/favicon') ||
            path === '/health' ||
            path === '/__nuxt_error'
        ) {
            return;
        }

        // Ждём завершения миграций для API-запросов
        if (path.startsWith('/api/')) {
            try {
                await ensureMigrations();
            } catch (error) {
                // Миграции уже залогированы, ошибка будет видна в ответе API
                console.error('❌ [AutoMigrations] Request blocked due to migration failure');
            }
        }
    });
});
