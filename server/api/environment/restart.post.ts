import { writeFile } from "fs/promises";
import { join } from "path";

/**
 * Перезапуск приложения для cPanel Node.js
 * POST /api/environment/restart
 */
export default defineEventHandler(async (event) => {
  console.log("[ENVIRONMENT] Restarting application...");

  try {
    // В cPanel Node.js приложения перезапускаются при изменении tmp/restart.txt
    const restartFilePath = join(process.cwd(), "tmp", "restart.txt");

    // Создаём/обновляем файл restart.txt
    await writeFile(restartFilePath, new Date().toISOString());

    console.log("[ENVIRONMENT] Restart file updated, application will restart");

    return {
      success: true,
      message: "Приложение перезапускается...",
      note: "Страница автоматически обновится через несколько секунд",
    };
  } catch (error: any) {
    console.error("[ENVIRONMENT] Failed to restart application:", error);

    // Если не удалось создать restart.txt, возвращаем инструкцию
    return {
      success: false,
      message: "Не удалось автоматически перезапустить приложение",
      instruction:
        "Перезапустите приложение вручную через cPanel: Node.js App → Restart",
    };
  }
});
