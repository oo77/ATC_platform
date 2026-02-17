import { g as defineEventHandler, H as runMigrations, h as createError } from '../../../_/nitro.mjs';
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

const migrate_post = defineEventHandler(async (event) => {
  console.log("[ENVIRONMENT] Starting database migrations...");
  try {
    await runMigrations();
    return {
      success: true,
      message: "\u041C\u0438\u0433\u0440\u0430\u0446\u0438\u0438 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E"
    };
  } catch (error) {
    console.error("[ENVIRONMENT] Migration failed:", error);
    throw createError({
      statusCode: 500,
      message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u043C\u0438\u0433\u0440\u0430\u0446\u0438\u0439: ${error.message}`,
      data: {
        stack: error.stack
      }
    });
  }
});

export { migrate_post as default };
//# sourceMappingURL=migrate.post.mjs.map
