# План реализации системы создания групп и архивации

## Обзор

Полная реализация системы управления учебными группами с обязательной загрузкой PDF-отчетов, ролевым доступом и архивацией.

---

## Этап 1: Подготовка базы данных

### 1.1 Создание миграции для `study_groups`

**Файл:** `server/database/migrations/20260114_add_archive_system.ts`

```typescript
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Добавляем поля для архивации
  await db.schema
    .alterTable("study_groups")
    .addColumn("is_archived", "boolean", (col) =>
      col.defaultTo(false).notNull()
    )
    .addColumn("archived_at", "timestamp")
    .addColumn("archived_by", "integer", (col) =>
      col.references("users.id").onDelete("set null")
    )
    .execute();

  // Создаем индексы для производительности
  await db.schema
    .createIndex("idx_study_groups_archived")
    .on("study_groups")
    .column("is_archived")
    .execute();

  await db.schema
    .createIndex("idx_study_groups_end_date")
    .on("study_groups")
    .column("end_date")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_study_groups_archived").execute();
  await db.schema.dropIndex("idx_study_groups_end_date").execute();

  await db.schema
    .alterTable("study_groups")
    .dropColumn("is_archived")
    .dropColumn("archived_at")
    .dropColumn("archived_by")
    .execute();
}
```

### 1.2 Расширение таблицы `files`

**Файл:** `server/database/migrations/20260114_extend_files_table.ts`

```typescript
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Добавляем метаданные для файлов
  await db.schema
    .alterTable("files")
    .addColumn("original_filename", "varchar(255)")
    .addColumn("uploaded_by", "integer", (col) =>
      col.references("users.id").onDelete("set null")
    )
    .addColumn("uploaded_at", "timestamp", (col) =>
      col.defaultTo(db.fn("now")).notNull()
    )
    .execute();

  // Индекс для быстрого поиска файлов группы
  await db.schema
    .createIndex("idx_files_group_category")
    .on("files")
    .columns(["group_id", "category"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_files_group_category").execute();

  await db.schema
    .alterTable("files")
    .dropColumn("original_filename")
    .dropColumn("uploaded_by")
    .dropColumn("uploaded_at")
    .execute();
}
```

### 1.3 Регистрация миграций

**Файл:** `server/database/migrator.ts`

Добавить в массив миграций:

```typescript
import * as Migration_20260114_add_archive_system from './migrations/20260114_add_archive_system'
import * as Migration_20260114_extend_files_table from './migrations/20260114_extend_files_table'

// В массив migrations:
Migration_20260114_add_archive_system,
Migration_20260114_extend_files_table,
```

### 1.4 Запуск миграций

```bash
npm run db:migrate
```

---

## Этап 2: Утилиты и валидация

### 2.1 Валидатор PDF-файлов

**Файл:** `server/utils/validatePdfFile.ts`

```typescript
export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  fileInfo?: {
    size: number;
    originalName: string;
  };
}

export async function validatePdfFile(
  file: File | Blob,
  originalName?: string
): Promise<PdfValidationResult> {
  const fileName = originalName || (file as File).name || "unknown";

  // 1. Проверка расширения
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return {
      valid: false,
      error: "Файл должен иметь расширение .pdf",
    };
  }

  // 2. Проверка MIME-типа (если доступен)
  if ((file as File).type && (file as File).type !== "application/pdf") {
    return {
      valid: false,
      error: "Неверный MIME-тип файла. Ожидается application/pdf",
    };
  }

  // 3. Проверка размера (макс 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Размер файла не должен превышать ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "Файл пустой (0 байт)",
    };
  }

  // 4. Проверка магических байтов PDF (%PDF-)
  try {
    const buffer = await file.arrayBuffer();
    const header = new Uint8Array(buffer.slice(0, 5));
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

    const isValidPdf = pdfSignature.every(
      (byte, index) => header[index] === byte
    );

    if (!isValidPdf) {
      return {
        valid: false,
        error: "Файл не является корректным PDF-документом",
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: "Ошибка при чтении файла",
    };
  }

  return {
    valid: true,
    fileInfo: {
      size: file.size,
      originalName: fileName,
    },
  };
}
```

### 2.2 Утилита для работы с файлами групп

**Файл:** `server/utils/groupFileStorage.ts`

```typescript
import fs from "fs/promises";
import path from "path";
import { sanitizeFilename } from "./sanitizeFilename";

export interface SaveGroupFileOptions {
  groupId: number;
  file: File | Blob;
  originalFilename: string;
  userId: number;
}

export interface SaveGroupFileResult {
  filePath: string;
  fileUrl: string;
  fileId?: number;
}

/**
 * Сохраняет файл отчета группы
 */
export async function saveGroupReportFile(
  options: SaveGroupFileOptions
): Promise<SaveGroupFileResult> {
  const { groupId, file, originalFilename, userId } = options;

  // Создаем безопасное имя файла
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalFilename);
  const filename = `${timestamp}_${sanitized}`;

  // Формируем путь: /storage/groups/{groupId}/reports/
  const relativePath = path.join("groups", String(groupId), "reports");
  const absolutePath = path.join(process.cwd(), "storage", relativePath);

  // Создаем директории если не существуют
  await fs.mkdir(absolutePath, { recursive: true });

  // Полный путь к файлу
  const fullPath = path.join(absolutePath, filename);

  // Сохраняем файл
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  // Формируем относительный путь для БД
  const dbPath = path.join(relativePath, filename).replace(/\\/g, "/");

  // URL для доступа к файлу
  const fileUrl = `/storage/${dbPath}`;

  return {
    filePath: dbPath,
    fileUrl,
  };
}

/**
 * Удаляет файл отчета группы
 */
export async function deleteGroupReportFile(filePath: string): Promise<void> {
  const absolutePath = path.join(process.cwd(), "storage", filePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    console.error("Ошибка при удалении файла:", error);
    // Не бросаем ошибку, файл может быть уже удален
  }
}

/**
 * Получает список всех отчетов группы
 */
export async function getGroupReportFiles(groupId: number): Promise<string[]> {
  const relativePath = path.join("groups", String(groupId), "reports");
  const absolutePath = path.join(process.cwd(), "storage", relativePath);

  try {
    const files = await fs.readdir(absolutePath);
    return files.map((f) => path.join(relativePath, f).replace(/\\/g, "/"));
  } catch (error) {
    // Директория не существует
    return [];
  }
}
```

### 2.3 Утилита для санитизации имен файлов

**Файл:** `server/utils/sanitizeFilename.ts`

```typescript
/**
 * Очищает имя файла от опасных символов и транслитерирует кириллицу
 */
export function sanitizeFilename(filename: string): string {
  // Разделяем имя и расширение
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex) : "";

  // Транслитерация кириллицы
  const transliterated = transliterate(name);

  // Удаляем все кроме букв, цифр, дефисов и подчеркиваний
  const cleaned = transliterated
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");

  // Ограничиваем длину (макс 100 символов)
  const truncated = cleaned.slice(0, 100);

  return truncated + ext;
}

/**
 * Простая транслитерация кириллицы в латиницу
 */
function transliterate(text: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "Yo",
    Ж: "Zh",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "H",
    Ц: "Ts",
    Ч: "Ch",
    Ш: "Sh",
    Щ: "Sch",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "Yu",
    Я: "Ya",
  };

  return text
    .split("")
    .map((char) => map[char] || char)
    .join("");
}
```

### 2.4 Утилита для логирования действий

**Файл:** `server/utils/auditLog.ts`

```typescript
import { db } from "../database";

export interface AuditLogEntry {
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  details?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Логирует действие пользователя
 */
export async function logAction(entry: AuditLogEntry): Promise<void> {
  try {
    await db
      .insertInto("audit_logs")
      .values({
        user_id: entry.userId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ip_address: entry.ipAddress,
        created_at: new Date(),
      })
      .execute();

    console.log(
      `[AUDIT] ${entry.action} by user ${entry.userId} on ${entry.entityType} ${entry.entityId}`
    );
  } catch (error) {
    console.error("Ошибка при записи audit log:", error);
    // Не бросаем ошибку, чтобы не прерывать основной процесс
  }
}
```

---

## Этап 3: Backend API

### 3.1 Создание группы с загрузкой файла

**Файл:** `server/api/groups/index.post.ts`

```typescript
import { defineEventHandler, readMultipartFormData, createError } from "h3";
import { db } from "~/server/database";
import { validatePdfFile } from "~/server/utils/validatePdfFile";
import { saveGroupReportFile } from "~/server/utils/groupFileStorage";
import { logAction } from "~/server/utils/auditLog";

export default defineEventHandler(async (event) => {
  // Проверка аутентификации
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // Проверка прав (только ADMIN и MODERATOR могут создавать группы)
  if (!["ADMIN", "MODERATOR"].includes(user.role)) {
    throw createError({ statusCode: 403, message: "Недостаточно прав" });
  }

  // Читаем multipart/form-data
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "Некорректные данные формы",
    });
  }

  // Извлекаем поля
  let groupData: any = {};
  let pdfFile: any = null;
  let pdfFilename = "";

  for (const part of formData) {
    if (part.name === "data") {
      // JSON с данными группы
      groupData = JSON.parse(part.data.toString("utf-8"));
    } else if (part.name === "reportFile") {
      // PDF файл
      pdfFile = part.data;
      pdfFilename = part.filename || "report.pdf";
    }
  }

  // Валидация: файл обязателен при создании
  if (!pdfFile) {
    throw createError({
      statusCode: 400,
      message: "PDF-отчет обязателен при создании группы",
    });
  }

  // Валидация PDF
  const validation = await validatePdfFile(new Blob([pdfFile]), pdfFilename);

  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      message: validation.error,
    });
  }

  // Валидация данных группы
  if (!groupData.course_id || !groupData.group_code) {
    throw createError({
      statusCode: 400,
      message: "Обязательные поля: course_id, group_code",
    });
  }

  // Транзакция: создаем группу и сохраняем файл
  try {
    const result = await db.transaction().execute(async (trx) => {
      // 1. Создаем группу
      const [group] = await trx
        .insertInto("study_groups")
        .values({
          course_id: groupData.course_id,
          group_code: groupData.group_code,
          start_date: groupData.start_date,
          end_date: groupData.end_date,
          is_active: true,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning(["id", "group_code"])
        .execute();

      // 2. Сохраняем файл
      const fileResult = await saveGroupReportFile({
        groupId: group.id,
        file: new Blob([pdfFile]),
        originalFilename: pdfFilename,
        userId: user.id,
      });

      // 3. Записываем метаданные файла в БД
      await trx
        .insertInto("files")
        .values({
          name: pdfFilename,
          path: fileResult.filePath,
          category: "group_report",
          group_id: group.id,
          original_filename: pdfFilename,
          uploaded_by: user.id,
          uploaded_at: new Date(),
        })
        .execute();

      return { group, fileUrl: fileResult.fileUrl };
    });

    // Логируем действие
    await logAction({
      userId: user.id,
      action: "GROUP_CREATED",
      entityType: "study_group",
      entityId: result.group.id,
      details: {
        groupCode: result.group.group_code,
        reportFile: pdfFilename,
      },
      ipAddress: event.node.req.socket.remoteAddress,
    });

    return {
      success: true,
      group: result.group,
      reportUrl: result.fileUrl,
    };
  } catch (error: any) {
    console.error("Ошибка при создании группы:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при создании группы: " + error.message,
    });
  }
});
```

### 3.2 Обновление группы

**Файл:** `server/api/groups/[id].put.ts`

```typescript
import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { db } from "~/server/database";
import { logAction } from "~/server/utils/auditLog";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  if (!["ADMIN", "MODERATOR"].includes(user.role)) {
    throw createError({ statusCode: 403, message: "Недостаточно прав" });
  }

  const groupId = parseInt(getRouterParam(event, "id") || "0");
  const body = await readBody(event);

  // Получаем текущую группу
  const existingGroup = await db
    .selectFrom("study_groups")
    .selectAll()
    .where("id", "=", groupId)
    .executeTakeFirst();

  if (!existingGroup) {
    throw createError({ statusCode: 404, message: "Группа не найдена" });
  }

  // Проверка: можно ли редактировать даты
  const now = new Date();
  const endDate = new Date(existingGroup.end_date);
  const canEditDates = user.role === "ADMIN" || now <= endDate;

  // Формируем данные для обновления
  const updateData: any = {
    updated_at: new Date(),
  };

  // Даты можно менять только если есть права
  if (body.start_date && canEditDates) {
    updateData.start_date = body.start_date;
  }
  if (body.end_date && canEditDates) {
    updateData.end_date = body.end_date;
  }

  // Остальные поля
  if (body.is_active !== undefined) {
    updateData.is_active = body.is_active;
  }

  // Архивация доступна только админам
  if (body.is_archived !== undefined) {
    if (user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        message: "Только администраторы могут архивировать группы",
      });
    }

    updateData.is_archived = body.is_archived;

    if (body.is_archived) {
      updateData.archived_at = new Date();
      updateData.archived_by = user.id;
    } else {
      // Восстановление из архива
      updateData.archived_at = null;
      updateData.archived_by = null;
    }
  }

  // Обновляем группу
  await db
    .updateTable("study_groups")
    .set(updateData)
    .where("id", "=", groupId)
    .execute();

  // Логируем
  await logAction({
    userId: user.id,
    action: body.is_archived ? "GROUP_ARCHIVED" : "GROUP_UPDATED",
    entityType: "study_group",
    entityId: groupId,
    details: updateData,
    ipAddress: event.node.req.socket.remoteAddress,
  });

  return { success: true };
});
```

### 3.3 Удаление группы (только Admin)

**Файл:** `server/api/groups/[id].delete.ts`

```typescript
import { defineEventHandler, createError, getRouterParam } from "h3";
import { db } from "~/server/database";
import { logAction } from "~/server/utils/auditLog";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // Только администраторы могут удалять группы
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      message: "Только администраторы могут удалять группы",
    });
  }

  const groupId = parseInt(getRouterParam(event, "id") || "0");

  // Проверяем существование группы
  const group = await db
    .selectFrom("study_groups")
    .select(["id", "group_code"])
    .where("id", "=", groupId)
    .executeTakeFirst();

  if (!group) {
    throw createError({ statusCode: 404, message: "Группа не найдена" });
  }

  // Удаляем (в реальности лучше использовать soft delete через is_archived)
  await db.deleteFrom("study_groups").where("id", "=", groupId).execute();

  // Логируем
  await logAction({
    userId: user.id,
    action: "GROUP_DELETED",
    entityType: "study_group",
    entityId: groupId,
    details: { groupCode: group.group_code },
    ipAddress: event.node.req.socket.remoteAddress,
  });

  return { success: true };
});
```

### 3.4 Получение отчетов группы

**Файл:** `server/api/groups/[id]/reports/index.get.ts`

```typescript
import { defineEventHandler, createError, getRouterParam } from "h3";
import { db } from "~/server/database";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  const groupId = parseInt(getRouterParam(event, "id") || "0");

  // Получаем все файлы отчетов группы
  const files = await db
    .selectFrom("files")
    .selectAll()
    .where("group_id", "=", groupId)
    .where("category", "=", "group_report")
    .orderBy("uploaded_at", "desc")
    .execute();

  return {
    success: true,
    files: files.map((f) => ({
      id: f.id,
      name: f.original_filename || f.name,
      url: `/storage/${f.path}`,
      uploadedAt: f.uploaded_at,
      uploadedBy: f.uploaded_by,
    })),
  };
});
```

### 3.5 Скачивание отчета

**Файл:** `server/api/groups/[groupId]/reports/[fileId].get.ts`

```typescript
import {
  defineEventHandler,
  createError,
  getRouterParam,
  sendStream,
} from "h3";
import { db } from "~/server/database";
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  const groupId = parseInt(getRouterParam(event, "groupId") || "0");
  const fileId = parseInt(getRouterParam(event, "fileId") || "0");

  // Получаем файл
  const file = await db
    .selectFrom("files")
    .selectAll()
    .where("id", "=", fileId)
    .where("group_id", "=", groupId)
    .where("category", "=", "group_report")
    .executeTakeFirst();

  if (!file) {
    throw createError({ statusCode: 404, message: "Файл не найден" });
  }

  // Проверяем доступ к группе (опционально)
  // TODO: добавить проверку, что пользователь имеет доступ к этой группе

  // Формируем путь к файлу
  const filePath = path.join(process.cwd(), "storage", file.path);

  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, message: "Файл не найден на диске" });
  }

  // Отправляем файл
  const stream = fs.createReadStream(filePath);

  event.node.res.setHeader("Content-Type", "application/pdf");
  event.node.res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(
      file.original_filename || file.name
    )}"`
  );

  return sendStream(event, stream);
});
```

### 3.6 Получение списка групп с фильтрацией

**Файл:** `server/api/groups/index.get.ts`

Обновить существующий эндпоинт:

```typescript
import { defineEventHandler, getQuery } from "h3";
import { db } from "~/server/database";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const showArchived = query.archived === "true";

  let dbQuery = db.selectFrom("study_groups").selectAll();

  // Фильтрация по архивным
  if (!showArchived) {
    dbQuery = dbQuery.where("is_archived", "=", false);
  }

  const groups = await dbQuery.orderBy("created_at", "desc").execute();

  return {
    success: true,
    groups,
  };
});
```

---

## Этап 4: Frontend (UI)

### 4.1 Обновление формы создания группы

**Файл:** `app/components/groups/GroupFormModal.vue`

```vue
<template>
  <UiModal :open="open" @close="handleClose" size="lg">
    <template #header>
      <h2 class="text-xl font-semibold">
        {{ isEdit ? "Редактировать группу" : "Создать группу" }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Код группы -->
      <UiInput
        v-model="formData.group_code"
        label="Код группы"
        required
        :disabled="isEdit"
      />

      <!-- Курс -->
      <UiSelect
        v-model="formData.course_id"
        label="Курс"
        :options="courseOptions"
        required
      />

      <!-- Даты -->
      <div class="grid grid-cols-2 gap-4">
        <UiDatePicker
          v-model="formData.start_date"
          label="Дата начала"
          required
          :disabled="!canEditDates"
        />
        <UiDatePicker
          v-model="formData.end_date"
          label="Дата окончания"
          required
          :disabled="!canEditDates"
        />
      </div>

      <!-- Предупреждение о блокировке дат -->
      <div v-if="!canEditDates && isEdit" class="alert alert-warning">
        <Icon name="mdi:alert" />
        <span>
          Редактирование дат заблокировано для завершенных курсов.
          {{
            userRole === "ADMIN"
              ? "Вы можете изменить их как администратор."
              : ""
          }}
        </span>
      </div>

      <!-- Загрузка PDF (только при создании) -->
      <div v-if="!isEdit" class="space-y-2">
        <label class="block text-sm font-medium">
          PDF-отчет (основание создания) *
        </label>

        <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          @change="handleFileSelect"
          class="file-input file-input-bordered w-full"
        />

        <!-- Превью выбранного файла -->
        <div v-if="selectedFile" class="card bg-base-200 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon name="mdi:file-pdf-box" class="text-2xl text-error" />
              <div>
                <p class="font-medium">{{ selectedFile.name }}</p>
                <p class="text-sm opacity-70">
                  {{ formatFileSize(selectedFile.size) }}
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="removeFile"
              class="btn btn-ghost btn-sm"
            >
              <Icon name="mdi:close" />
            </button>
          </div>

          <!-- Превью PDF -->
          <div v-if="pdfPreviewUrl" class="mt-4">
            <iframe
              :src="pdfPreviewUrl"
              class="w-full h-96 border rounded"
            ></iframe>
          </div>
        </div>

        <p v-if="fileError" class="text-error text-sm">{{ fileError }}</p>
      </div>

      <!-- Просмотр существующих отчетов (при редактировании) -->
      <div v-if="isEdit && existingReports.length > 0" class="space-y-2">
        <label class="block text-sm font-medium">Загруженные отчеты</label>
        <div class="space-y-2">
          <div
            v-for="report in existingReports"
            :key="report.id"
            class="card bg-base-200 p-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <Icon name="mdi:file-pdf-box" class="text-xl text-error" />
              <span>{{ report.name }}</span>
            </div>
            <a :href="report.url" target="_blank" class="btn btn-ghost btn-sm">
              <Icon name="mdi:download" />
              Скачать
            </a>
          </div>
        </div>
      </div>

      <!-- Прогресс загрузки -->
      <UiProgressBar v-if="uploadProgress > 0" :value="uploadProgress" />

      <!-- Кнопки -->
      <div class="flex justify-end gap-2 mt-6">
        <button type="button" @click="handleClose" class="btn btn-ghost">
          Отмена
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting || (!isEdit && !selectedFile)"
        >
          <span v-if="isSubmitting" class="loading loading-spinner"></span>
          {{ isEdit ? "Сохранить" : "Создать" }}
        </button>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useNotification } from "~/composables/useNotification";
import { useAuthStore } from "~/stores/auth";

const props = defineProps<{
  open: boolean;
  group?: any;
  courseOptions: Array<{ value: number; label: string }>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const authStore = useAuthStore();
const { showSuccess, showError } = useNotification();

const isEdit = computed(() => !!props.group);
const userRole = computed(() => authStore.user?.role);

const formData = ref({
  group_code: "",
  course_id: null as number | null,
  start_date: "",
  end_date: "",
});

const selectedFile = ref<File | null>(null);
const pdfPreviewUrl = ref<string | null>(null);
const fileError = ref<string | null>(null);
const uploadProgress = ref(0);
const isSubmitting = ref(false);
const existingReports = ref<any[]>([]);

const fileInput = ref<HTMLInputElement | null>(null);

// Проверка: можно ли редактировать даты
const canEditDates = computed(() => {
  if (!isEdit.value) return true;
  if (userRole.value === "ADMIN") return true;

  const now = new Date();
  const endDate = props.group?.end_date ? new Date(props.group.end_date) : null;

  return endDate ? now <= endDate : true;
});

// Загрузка данных группы при редактировании
watch(
  () => props.group,
  async (newGroup) => {
    if (newGroup) {
      formData.value = {
        group_code: newGroup.group_code,
        course_id: newGroup.course_id,
        start_date: newGroup.start_date,
        end_date: newGroup.end_date,
      };

      // Загружаем список отчетов
      await loadExistingReports(newGroup.id);
    }
  },
  { immediate: true }
);

async function loadExistingReports(groupId: number) {
  try {
    const response = await $fetch(`/api/groups/${groupId}/reports`);
    if (response.success) {
      existingReports.value = response.files;
    }
  } catch (error) {
    console.error("Ошибка загрузки отчетов:", error);
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  fileError.value = null;

  // Валидация на клиенте
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    fileError.value = "Файл должен быть в формате PDF";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    fileError.value = "Размер файла не должен превышать 10MB";
    return;
  }

  selectedFile.value = file;

  // Создаем превью
  const url = URL.createObjectURL(file);
  pdfPreviewUrl.value = url;
}

function removeFile() {
  selectedFile.value = null;
  pdfPreviewUrl.value = null;
  fileError.value = null;

  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function handleSubmit() {
  if (isSubmitting.value) return;

  // Валидация
  if (!formData.value.course_id || !formData.value.group_code) {
    showError("Заполните все обязательные поля");
    return;
  }

  if (!isEdit.value && !selectedFile.value) {
    showError("Загрузите PDF-отчет");
    return;
  }

  isSubmitting.value = true;
  uploadProgress.value = 0;

  try {
    if (isEdit.value) {
      // Обновление группы
      await $fetch(`/api/groups/${props.group.id}`, {
        method: "PUT",
        body: formData.value,
      });

      showSuccess("Группа успешно обновлена");
    } else {
      // Создание группы с файлом
      const formDataToSend = new FormData();

      // Добавляем JSON-данные
      formDataToSend.append("data", JSON.stringify(formData.value));

      // Добавляем файл
      formDataToSend.append("reportFile", selectedFile.value!);

      // Отправляем с отслеживанием прогресса
      await uploadWithProgress("/api/groups", formDataToSend);

      showSuccess("Группа успешно создана");
    }

    emit("success");
    handleClose();
  } catch (error: any) {
    console.error("Ошибка при сохранении группы:", error);
    showError(error.data?.message || "Ошибка при сохранении группы");
  } finally {
    isSubmitting.value = false;
    uploadProgress.value = 0;
  }
}

function uploadWithProgress(url: string, formData: FormData): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.statusText));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));

    xhr.open("POST", url);
    xhr.send(formData);
  });
}

function handleClose() {
  // Очищаем форму
  formData.value = {
    group_code: "",
    course_id: null,
    start_date: "",
    end_date: "",
  };

  removeFile();
  existingReports.value = [];

  emit("close");
}
</script>
```

### 4.2 Обновление списка групп

**Файл:** `app/pages/groups/index.vue`

Добавить фильтрацию и кнопки управления:

```vue
<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Группы</h1>

      <button
        v-if="canCreateGroup"
        @click="openCreateModal"
        class="btn btn-primary"
      >
        <Icon name="mdi:plus" />
        Создать группу
      </button>
    </div>

    <!-- Табы: Активные / Архивные -->
    <div class="tabs tabs-boxed mb-4">
      <a
        class="tab"
        :class="{ 'tab-active': !showArchived }"
        @click="showArchived = false"
      >
        Активные ({{ activeCount }})
      </a>
      <a
        class="tab"
        :class="{ 'tab-active': showArchived }"
        @click="showArchived = true"
      >
        Архив ({{ archivedCount }})
      </a>
    </div>

    <!-- Список групп -->
    <div class="grid gap-4">
      <div
        v-for="group in filteredGroups"
        :key="group.id"
        class="card bg-base-100 shadow-md"
      >
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="card-title">{{ group.group_code }}</h3>

              <!-- Статусы -->
              <div class="flex gap-2 mt-2">
                <span v-if="group.is_archived" class="badge badge-neutral">
                  📦 Архивирована
                </span>
                <span v-else-if="isExpired(group)" class="badge badge-warning">
                  ⏰ Завершена
                </span>
                <span v-else class="badge badge-success"> ✅ Активна </span>
              </div>

              <p class="text-sm opacity-70 mt-2">
                {{ formatDateRange(group.start_date, group.end_date) }}
              </p>
            </div>

            <!-- Действия -->
            <div class="flex gap-2">
              <button
                @click="openEditModal(group)"
                class="btn btn-ghost btn-sm"
              >
                <Icon name="mdi:pencil" />
              </button>

              <!-- Архивация (только Admin) -->
              <button
                v-if="canArchive && !group.is_archived"
                @click="archiveGroup(group)"
                class="btn btn-ghost btn-sm"
                title="Архивировать"
              >
                <Icon name="mdi:archive" />
              </button>

              <!-- Восстановление (только Admin) -->
              <button
                v-if="canArchive && group.is_archived"
                @click="unarchiveGroup(group)"
                class="btn btn-ghost btn-sm"
                title="Восстановить"
              >
                <Icon name="mdi:archive-arrow-up" />
              </button>

              <!-- Удаление (только Admin) -->
              <button
                v-if="canDelete"
                @click="deleteGroup(group)"
                class="btn btn-ghost btn-sm text-error"
              >
                <Icon name="mdi:delete" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно -->
    <GroupFormModal
      :open="modalOpen"
      :group="selectedGroup"
      :course-options="courseOptions"
      @close="closeModal"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useNotification } from "~/composables/useNotification";

const authStore = useAuthStore();
const { showSuccess, showError, showConfirm } = useNotification();

const groups = ref<any[]>([]);
const showArchived = ref(false);
const modalOpen = ref(false);
const selectedGroup = ref<any>(null);
const courseOptions = ref<any[]>([]);

const userRole = computed(() => authStore.user?.role);
const canCreateGroup = computed(() =>
  ["ADMIN", "MODERATOR"].includes(userRole.value || "")
);
const canArchive = computed(() => userRole.value === "ADMIN");
const canDelete = computed(() => userRole.value === "ADMIN");

const filteredGroups = computed(() => {
  return groups.value.filter((g) => g.is_archived === showArchived.value);
});

const activeCount = computed(
  () => groups.value.filter((g) => !g.is_archived).length
);
const archivedCount = computed(
  () => groups.value.filter((g) => g.is_archived).length
);

async function loadGroups() {
  try {
    const response = await $fetch("/api/groups", {
      query: { archived: "all" },
    });
    groups.value = response.groups;
  } catch (error) {
    showError("Ошибка загрузки групп");
  }
}

function isExpired(group: any): boolean {
  return new Date(group.end_date) < new Date();
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start).toLocaleDateString("ru-RU");
  const endDate = new Date(end).toLocaleDateString("ru-RU");
  return `${startDate} — ${endDate}`;
}

function openCreateModal() {
  selectedGroup.value = null;
  modalOpen.value = true;
}

function openEditModal(group: any) {
  selectedGroup.value = group;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  selectedGroup.value = null;
}

async function handleSuccess() {
  await loadGroups();
}

async function archiveGroup(group: any) {
  const confirmed = await showConfirm(
    "Архивировать группу?",
    "Группа будет скрыта из активных списков. Данные сохранятся."
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/groups/${group.id}`, {
      method: "PUT",
      body: { is_archived: true },
    });

    showSuccess("Группа архивирована");
    await loadGroups();
  } catch (error) {
    showError("Ошибка при архивации группы");
  }
}

async function unarchiveGroup(group: any) {
  try {
    await $fetch(`/api/groups/${group.id}`, {
      method: "PUT",
      body: { is_archived: false },
    });

    showSuccess("Группа восстановлена");
    await loadGroups();
  } catch (error) {
    showError("Ошибка при восстановлении группы");
  }
}

async function deleteGroup(group: any) {
  const confirmed = await showConfirm(
    "Удалить группу?",
    "Это действие необратимо. Все данные группы будут удалены."
  );

  if (!confirmed) return;

  try {
    await $fetch(`/api/groups/${group.id}`, {
      method: "DELETE",
    });

    showSuccess("Группа удалена");
    await loadGroups();
  } catch (error: any) {
    showError(error.data?.message || "Ошибка при удалении группы");
  }
}

// Загружаем данные при монтировании
onMounted(async () => {
  await loadGroups();
  // Загрузка списка курсов для селекта
  const coursesResponse = await $fetch("/api/courses");
  courseOptions.value = coursesResponse.courses.map((c: any) => ({
    value: c.id,
    label: c.name,
  }));
});
</script>
```

---

## Этап 5: Тестирование

### 5.1 Чек-лист функциональности

```markdown
## Создание группы

- [ ] Форма открывается корректно
- [ ] Валидация обязательных полей работает
- [ ] Загрузка PDF-файла работает
- [ ] Превью PDF отображается
- [ ] Валидация формата файла (только PDF)
- [ ] Валидация размера файла (макс 10MB)
- [ ] Прогресс-бар загрузки работает
- [ ] Группа создается в БД
- [ ] Файл сохраняется в правильную директорию
- [ ] Запись в таблицу files создается
- [ ] Логирование действия работает

## Редактирование группы

- [ ] Форма открывается с данными группы
- [ ] Список существующих отчетов загружается
- [ ] Скачивание отчетов работает
- [ ] Блокировка дат для завершенных курсов (Moderator)
- [ ] Админ может редактировать даты всегда
- [ ] Изменения сохраняются корректно

## Архивация

- [ ] Кнопка "Архивировать" видна только Admin
- [ ] Модальное окно подтверждения работает
- [ ] Группа переносится в архив
- [ ] Поля archived_at и archived_by заполняются
- [ ] Логирование работает
- [ ] Восстановление из архива работает

## Удаление

- [ ] Кнопка "Удалить" видна только Admin
- [ ] Модератор получает 403 при попытке удаления
- [ ] Подтверждение удаления работает
- [ ] Группа удаляется из БД
- [ ] Логирование работает

## Фильтрация

- [ ] Табы "Активные" / "Архив" работают
- [ ] Счетчики групп корректны
- [ ] Статусы групп отображаются правильно

## Безопасность

- [ ] Неавторизованные пользователи получают 401
- [ ] Студенты не могут создавать группы
- [ ] Модераторы не могут удалять группы
- [ ] Модераторы не могут архивировать группы
- [ ] Валидация PDF на сервере работает
- [ ] Проверка магических байтов работает
```

### 5.2 Тестовые сценарии

```typescript
// tests/groups/create-group.spec.ts
describe("Создание группы", () => {
  it("должно создать группу с PDF-отчетом", async () => {
    // Подготовка
    const groupData = {
      course_id: 1,
      group_code: "TEST-001",
      start_date: "2026-01-15",
      end_date: "2026-03-15",
    };

    const pdfFile = new File(["%PDF-1.4..."], "report.pdf", {
      type: "application/pdf",
    });

    // Действие
    const formData = new FormData();
    formData.append("data", JSON.stringify(groupData));
    formData.append("reportFile", pdfFile);

    const response = await fetch("/api/groups", {
      method: "POST",
      body: formData,
    });

    // Проверка
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.group).toBeDefined();
  });

  it("должно отклонить файл не в формате PDF", async () => {
    const txtFile = new File(["text"], "report.txt", {
      type: "text/plain",
    });

    const formData = new FormData();
    formData.append("data", JSON.stringify({ course_id: 1 }));
    formData.append("reportFile", txtFile);

    const response = await fetch("/api/groups", {
      method: "POST",
      body: formData,
    });

    expect(response.status).toBe(400);
  });
});
```

---

## Этап 6: Развертывание

### 6.1 Последовательность действий

```bash
# 1. Создать резервную копию БД
npm run db:backup

# 2. Запустить миграции
npm run db:migrate

# 3. Проверить миграции
npm run db:migrate:status

# 4. Перезапустить сервер
npm run build
npm run start

# 5. Проверить логи
tail -f logs/app.log
```

### 6.2 Откат при проблемах

```bash
# Откат последней миграции
npm run db:migrate:down

# Восстановление из бэкапа
npm run db:restore
```

---

## Этап 7: Документация

### 7.1 Обновить README

Добавить раздел:

```markdown
## Управление группами

### Создание группы

1. Перейдите в раздел "Группы"
2. Нажмите "Создать группу"
3. Заполните обязательные поля
4. Загрузите PDF-отчет (основание создания)
5. Нажмите "Создать"

### Архивация группы

Только администраторы могут архивировать группы.

1. Найдите группу в списке
2. Нажмите кнопку "Архивировать"
3. Подтвердите действие

Архивированные группы скрыты из активных списков, но доступны во вкладке "Архив".
```

### 7.2 API документация

Создать файл `docs/api/groups.md`:

```markdown
# API: Группы

## POST /api/groups

Создание новой группы с загрузкой PDF-отчета.

**Content-Type:** multipart/form-data

**Поля:**

- `data` (JSON): Данные группы
- `reportFile` (File): PDF-файл

**Пример:**
\`\`\`javascript
const formData = new FormData()
formData.append('data', JSON.stringify({
course_id: 1,
group_code: 'ATC-2026-01',
start_date: '2026-01-15',
end_date: '2026-03-15'
}))
formData.append('reportFile', pdfFile)

await fetch('/api/groups', {
method: 'POST',
body: formData
})
\`\`\`

## PUT /api/groups/:id

Обновление группы.

## DELETE /api/groups/:id

Удаление группы (только Admin).

## GET /api/groups/:id/reports

Получение списка отчетов группы.

## GET /api/groups/:groupId/reports/:fileId

Скачивание отчета.
```

---

## Итоговый чек-лист реализации

### Высокий приоритет

- [x] Миграция БД для `study_groups`
- [x] Миграция БД для `files`
- [x] Валидатор PDF-файлов
- [x] Утилита сохранения файлов
- [x] Утилита логирования
- [x] API создания группы
- [x] API обновления группы
- [x] API удаления группы
- [x] API получения отчетов
- [x] Форма создания/редактирования
- [x] Список групп с фильтрацией
- [x] Тестирование основных сценариев

### Средний приоритет

- [ ] Rate limiting для загрузки файлов
- [ ] E2E тесты
- [ ] Массовая архивация
- [ ] Расширенные права доступа

### Низкий приоритет

- [ ] История изменений группы
- [ ] Экспорт списка групп
- [ ] Уведомления при архивации

---

## Оценка времени

- **Этап 1 (БД):** 2 часа
- **Этап 2 (Утилиты):** 3 часа
- **Этап 3 (Backend API):** 5 часов
- **Этап 4 (Frontend):** 6 часов
- **Этап 5 (Тестирование):** 4 часа
- **Этап 6-7 (Развертывание и документация):** 2 часа

**Итого:** ~22 часа (3 рабочих дня)

---

## Риски и митигация

| Риск                                 | Вероятность | Митигация                           |
| ------------------------------------ | ----------- | ----------------------------------- |
| Проблемы с загрузкой больших файлов  | Средняя     | Ограничение размера, chunked upload |
| Конфликты при одновременном создании | Низкая      | Уникальный индекс на group_code     |
| Потеря файлов при сбое               | Низкая      | Транзакции, резервное копирование   |
| Проблемы с кириллицей в именах       | Средняя     | Транслитерация имен файлов          |

---

**Статус:** Готов к реализации
**Версия:** 1.0
**Дата:** 2026-01-14
