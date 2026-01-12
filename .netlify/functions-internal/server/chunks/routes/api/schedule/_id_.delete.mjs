import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { a as getScheduleEventById, d as deleteScheduleEvent } from '../../../_/scheduleRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import '../../../_/activityLogRepository.mjs';

const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const scheduleEvent = await getScheduleEventById(id);
    if (!scheduleEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      });
    }
    const deleted = await deleteScheduleEvent(id);
    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      });
    }
    await logActivity(
      event,
      "DELETE",
      "SCHEDULE",
      id,
      scheduleEvent.title,
      {
        deletedEvent: {
          title: scheduleEvent.title,
          startTime: scheduleEvent.startTime,
          endTime: scheduleEvent.endTime,
          groupId: scheduleEvent.groupId,
          instructorId: scheduleEvent.instructorId
        }
      }
    );
    return {
      success: true,
      message: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u043E"
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error deleting schedule event:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u044F"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
