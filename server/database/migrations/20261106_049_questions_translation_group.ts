import type { PoolConnection } from "mysql2/promise";
import { randomUUID } from "node:crypto";

/**
 * Миграция: связь переводов вопросов (translation_group_id)
 * Дата: 2026-11-06
 *
 * Нужна для переключения языка во время теста: вопрос на другом языке
 * находится по общему translation_group_id.
 * Автосвязывание: внутри банка вопросы разных языков сопоставляются по порядку
 * (order_index, created_at, id), только если количество совпадает и у каждой пары
 * совпадают тип вопроса, id вариантов и id правильных вариантов.
 */

export const description =
  "Добавление questions.translation_group_id и автосвязывание переводов вопросов внутри банков";

const parseOptions = (raw: any): any[] => {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v?.options) ? v.options : [];
  } catch {
    return [];
  }
};

const signature = (q: any): string => {
  const o = parseOptions(q.options);
  return [
    q.question_type,
    o.map((x) => x.id).sort().join(","),
    o.filter((x) => x.correct).map((x) => x.id).sort().join(","),
  ].join("|");
};

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20261106_049_questions_translation_group");

  await connection.query(`
    ALTER TABLE questions
    ADD COLUMN translation_group_id VARCHAR(191) NULL,
    ADD INDEX idx_questions_translation_group (translation_group_id);
  `);

  const [rows] = await connection.query<any[]>(
    `SELECT id, bank_id, language, question_type, options
     FROM questions
     ORDER BY bank_id, order_index, created_at, id`,
  );

  const banks = new Map<string, Map<string, any[]>>();
  for (const q of rows) {
    if (!banks.has(q.bank_id)) banks.set(q.bank_id, new Map());
    const langs = banks.get(q.bank_id)!;
    if (!langs.has(q.language)) langs.set(q.language, []);
    langs.get(q.language)!.push(q);
  }

  let linked = 0;
  for (const langs of banks.values()) {
    if (langs.size < 2) continue;
    const baseLang = langs.has("ru") ? "ru" : [...langs.keys()][0];
    const base = langs.get(baseLang)!;
    const groupIds: (string | null)[] = base.map(() => null);

    for (const [lang, list] of langs) {
      if (lang === baseLang || list.length !== base.length) continue;
      if (!list.every((q, i) => signature(q) === signature(base[i]))) continue;

      for (let i = 0; i < base.length; i++) {
        const gid = groupIds[i] ?? (groupIds[i] = randomUUID());
        await connection.query(
          "UPDATE questions SET translation_group_id = ? WHERE id IN (?, ?)",
          [gid, base[i].id, list[i].id],
        );
        linked++;
      }
    }
  }

  console.log(`ℹ️  Linked question pairs: ${linked}`);
  console.log("✅ Migration 20261106_049_questions_translation_group completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    ALTER TABLE questions
    DROP INDEX idx_questions_translation_group,
    DROP COLUMN translation_group_id;
  `);
};
