import { g as defineEventHandler, r as readBody, h as createError } from '../../_/nitro.mjs';
import { c as createClassroom } from '../../_/scheduleRepository.mjs';
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
import '../../_/timeUtils.mjs';

const createClassroomSchema = z.object({
  name: z.string().min(1, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"),
  capacity: z.number().int().min(0).optional(),
  description: z.string().optional()
});
const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validatedData = createClassroomSchema.parse(body);
    const classroom = await createClassroom(validatedData);
    return {
      success: true,
      classroom: {
        ...classroom,
        createdAt: classroom.createdAt.toISOString(),
        updatedAt: classroom.updatedAt.toISOString()
      }
    };
  } catch (error) {
    console.error("Error creating classroom:", error);
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        data: error.errors
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
