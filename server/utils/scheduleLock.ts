import { createError } from "h3";
import { getDbPool } from "./db";

const LOCK_NAME = "atc_schedule_write";

/**
 * Защита от гонок: «проверка конфликтов → запись» выполняется под
 * общей блокировкой MySQL (GET_LOCK), иначе два менеджера одновременно могут
 * занять одну аудиторию — оба пройдут проверку до записи друг друга.
 *
 * Блокировка держится на отдельном соединении, а fn берёт свои из пула.
 * Нагрузка на запись расписания низкая, поэтому одна глобальная блокировка
 * проще и надёжнее построчных SELECT ... FOR UPDATE.
 */
export async function withScheduleWriteLock<T>(
  fn: () => Promise<T>,
  timeoutSeconds = 10,
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    const [rows] = await connection.query("SELECT GET_LOCK(?, ?) AS got", [
      LOCK_NAME,
      timeoutSeconds,
    ]);
    if (Number((rows as any[])[0]?.got) !== 1) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "Расписание сейчас изменяет другой пользователь. Повторите через несколько секунд",
      });
    }
    try {
      return await fn();
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]).catch(() => {});
    }
  } finally {
    connection.release();
  }
}
