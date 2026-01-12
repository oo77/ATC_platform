import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody } from '../../../../../nitro/nitro.mjs';
import { b as updateDiscipline } from '../../../../../_/courseRepository.mjs';
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
import 'jsonwebtoken';

const _disciplineId__patch = defineEventHandler(async (event) => {
  try {
    const disciplineId = getRouterParam(event, "disciplineId");
    if (!disciplineId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const body = await readBody(event);
    if (body.name !== void 0 && (typeof body.name !== "string" || !body.name.trim())) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u043E\u0439"
      });
    }
    if (body.theoryHours !== void 0 && (typeof body.theoryHours !== "number" || body.theoryHours < 0)) {
      throw createError({
        statusCode: 400,
        message: "\u0427\u0430\u0441\u044B \u0442\u0435\u043E\u0440\u0438\u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u043D\u0435\u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C"
      });
    }
    if (body.practiceHours !== void 0 && (typeof body.practiceHours !== "number" || body.practiceHours < 0)) {
      throw createError({
        statusCode: 400,
        message: "\u0427\u0430\u0441\u044B \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u043D\u0435\u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C"
      });
    }
    if (body.assessmentHours !== void 0 && (typeof body.assessmentHours !== "number" || body.assessmentHours < 0)) {
      throw createError({
        statusCode: 400,
        message: "\u0427\u0430\u0441\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0437\u043D\u0430\u043D\u0438\u0439 \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u043D\u0435\u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C"
      });
    }
    const discipline = await updateDiscipline(disciplineId, {
      name: body.name,
      description: body.description,
      theoryHours: body.theoryHours,
      practiceHours: body.practiceHours,
      assessmentHours: body.assessmentHours,
      orderIndex: body.orderIndex,
      instructorIds: body.instructorIds
    });
    if (!discipline) {
      throw createError({
        statusCode: 404,
        message: "\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    return {
      success: true,
      discipline,
      message: "\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("Error updating discipline:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0443"
    });
  }
});

export { _disciplineId__patch as default };
//# sourceMappingURL=_disciplineId_.patch.mjs.map
