import { d as defineEventHandler, a as getRouterParam } from '../../../../../nitro/nitro.mjs';
import { a as getTestAssignmentByScheduleEventId } from '../../../../../_/testAssignmentRepository.mjs';
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

const _eventId__get = defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, "eventId");
    if (!eventId) {
      return {
        success: false,
        message: "ID \u0437\u0430\u043D\u044F\u0442\u0438\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const assignment = await getTestAssignmentByScheduleEventId(eventId);
    return {
      success: true,
      assignment
      // может быть null, если нет назначения
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F"
    };
  }
});

export { _eventId__get as default };
//# sourceMappingURL=_eventId_.get.mjs.map
