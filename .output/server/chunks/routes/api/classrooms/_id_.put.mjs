import { g as defineEventHandler, j as getRouterParam, h as createError, r as readBody } from '../../../_/nitro.mjs';
import { u as updateClassroom } from '../../../_/scheduleRepository.mjs';
import { z } from 'zod';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';
import '../../../_/timeUtils.mjs';

const updateClassroomSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});
const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const body = await readBody(event);
    const validatedData = updateClassroomSchema.parse(body);
    const classroom = await updateClassroom(id, validatedData);
    if (!classroom) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    return {
      success: true,
      classroom: {
        ...classroom,
        createdAt: classroom.createdAt.toISOString(),
        updatedAt: classroom.updatedAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Error updating classroom:", error);
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        data: error.errors
      });
    }
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
