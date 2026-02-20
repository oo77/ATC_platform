/**
 * POST /api/classrooms
 * Создание новой аудитории
 */

import { createClassroom } from "../../repositories/scheduleRepository";
import { z } from "zod";

const createClassroomSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  capacity: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Валидация
    const validatedData = createClassroomSchema.parse(body);

    const classroom = await createClassroom(validatedData);

    return {
      success: true,
      classroom: {
        ...classroom,
        createdAt: classroom.createdAt.toISOString(),
        updatedAt: classroom.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error creating classroom:", error);

    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        message: "Ошибка валидации данных",
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка при создании аудитории",
    });
  }
});
