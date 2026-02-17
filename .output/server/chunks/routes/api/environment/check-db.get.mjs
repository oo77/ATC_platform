import { w as getDbPool, g as defineEventHandler } from '../../../_/nitro.mjs';
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

const useDatabase = () => {
  return getDbPool();
};

const checkDb_get = defineEventHandler(async (event) => {
  try {
    const db = useDatabase();
    const connection = await db.getConnection();
    try {
      await connection.execute("SELECT 1 as test");
    } finally {
      connection.release();
    }
    return {
      connected: true,
      message: "\u0411\u0430\u0437\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E"
    };
  } catch (error) {
    console.error("[ENVIRONMENT] Database check failed:", error);
    return {
      connected: false,
      error: error.code || "UNKNOWN_ERROR",
      message: error.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F"
    };
  }
});

export { checkDb_get as default };
//# sourceMappingURL=check-db.get.mjs.map
