import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
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

const certificates_post = defineEventHandler(async (event) => {
  console.warn("[DEPRECATED] POST /api/students/:id/certificates is deprecated. Use POST /api/certificates/issue/[groupId] instead.");
  throw createError({
    statusCode: 410,
    // Gone
    message: "\u042D\u0442\u043E\u0442 \u044D\u043D\u0434\u043F\u043E\u0438\u043D\u0442 \u0443\u0441\u0442\u0430\u0440\u0435\u043B. \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0442\u0435\u043F\u0435\u0440\u044C \u0432\u044B\u0434\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0435\u0440\u0435\u0437 \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0433\u0440\u0443\u043F\u043F. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0432\u044B\u0434\u0430\u0447\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0432 \u0433\u0440\u0443\u043F\u043F\u0435."
  });
});

export { certificates_post as default };
//# sourceMappingURL=certificates.post.mjs.map
