import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Добавляем колонку allowed_student_ids в таблицу schedule_events
  await db.schema
    .alterTable("schedule_events")
    .addColumn("allowed_student_ids", "json", (col) => col.defaultTo(null))
    .execute();

  // Миграция данных: копируем allowed_student_ids из test_assignments в schedule_events
  // для соответствующих событий (чтобы сохранить целостность существующих данных)
  await sql`
    UPDATE schedule_events se
    JOIN test_assignments ta ON se.id = ta.schedule_event_id
    SET se.allowed_student_ids = ta.allowed_student_ids
    WHERE ta.allowed_student_ids IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("schedule_events")
    .dropColumn("allowed_student_ids")
    .execute();
}
