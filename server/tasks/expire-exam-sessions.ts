import { defineTask } from 'nitropack/runtime';
import { expireOverdueExamSessions } from '../utils/examCompletion';

/**
 * Каждую минуту завершает тесты, у которых вышло время.
 * Без этого тест по таймеру завершала только открытая вкладка браузера:
 * если слушатель закрыл её, сессия оставалась «в процессе» без результата.
 */
export default defineTask({
    meta: {
        name: 'expire-exam-sessions',
        description: 'Auto-finish test and attestation sessions whose time limit has passed',
    },
    async run() {
        const { tests, attestation } = await expireOverdueExamSessions();
        if (tests || attestation) {
            console.log(`[Task: ExpireExamSessions] Завершено по времени: тестов ${tests}, аттестаций ${attestation}`);
        }
        return { result: { tests, attestation } };
    },
});
