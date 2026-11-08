import { createHash } from "crypto";

/**
 * Версия визуального содержимого шаблона (SHA-1 от template_data).
 * Не зависит от имени, счётчика номеров и флага активности, поэтому меняется
 * только когда меняется то, что попадает на сертификат.
 */
export function computeTemplateRenderHash(templateData: unknown): string {
  return createHash("sha1")
    .update(JSON.stringify(templateData ?? null))
    .digest("hex");
}

/** Использует ли шаблон данные инструктора (их нельзя восстановить без снимка) */
export function templateUsesInstructor(templateData: unknown): boolean {
  return JSON.stringify(templateData ?? null).includes("instructor.");
}
