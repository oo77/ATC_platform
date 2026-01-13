/**
 * Migration: Add student_id and instructor_id to users table
 * Adds foreign key references to students and instructors tables
 */

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    // Добавляем поле student_id с внешним ключом на таблицу students
    table.uuid("student_id").nullable();
    table
      .foreign("student_id")
      .references("id")
      .inTable("students")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    // Добавляем поле instructor_id с внешним ключом на таблицу instructors
    table.uuid("instructor_id").nullable();
    table
      .foreign("instructor_id")
      .references("id")
      .inTable("instructors")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    // Добавляем индексы для улучшения производительности
    table.index("student_id");
    table.index("instructor_id");
  });

  console.log("✅ Added student_id and instructor_id columns to users table");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    // Удаляем внешние ключи и индексы
    table.dropForeign(["student_id"]);
    table.dropForeign(["instructor_id"]);
    table.dropIndex(["student_id"]);
    table.dropIndex(["instructor_id"]);

    // Удаляем столбцы
    table.dropColumn("student_id");
    table.dropColumn("instructor_id");
  });

  console.log(
    "✅ Removed student_id and instructor_id columns from users table"
  );
}
