/**
 * PUT /api/classrooms/:id
 * Обновление аудитории
 */

import { updateClassroom } from "../../repositories/scheduleRepository";
import { z } from "zod";

const updateClassroomSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  isActive: z
    .union([z.boolean(), z.number().transform((v) => Boolean(v))])
    .optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID аудитории обязателен",
      });
    }

    const body = await readBody(event);
    const validatedData = updateClassroomSchema.parse(body);

    const classroom = await updateClassroom(id, validatedData);

    if (!classroom) {
      throw createError({
        statusCode: 404,
        message: "Аудитория не найдена",
      });
    }

    return {
      success: true,
      classroom: {
        ...classroom,
        createdAt: classroom.createdAt.toISOString(),
        updatedAt: classroom.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error updating classroom:", error);

    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        message: "Ошибка валидации данных",
        data: error.errors,
      });
    }

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка при обновлении аудитории",
    });
  }
});
