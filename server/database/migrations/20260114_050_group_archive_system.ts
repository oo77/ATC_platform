import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Добавляем поля для архивации, если их нет
  // is_archived скорее всего уже есть, добавим только таймстемп и юзера

  try {
    await db.schema
      .alterTable("study_groups")
      .addColumn("archived_at", "datetime", (col: any) => col.defaultTo(null))
      .execute();
  } catch (e) {
    // Игнорируем ошибку если колонка есть
    console.log("Column archived_at might already exist or error:", e);
  }

  try {
    await db.schema
      .alterTable("study_groups")
      .addColumn("archived_by", "varchar(36)", (col: any) =>
        col.defaultTo(null)
      )
      .execute();
  } catch (e) {
    // Игнорируем ошибку если колонка есть
    console.log("Column archived_by might already exist or error:", e);
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("study_groups")
    .dropColumn("archived_by")
    .execute();
  await db.schema
    .alterTable("study_groups")
    .dropColumn("archived_at")
    .execute();
}
