import { g as defineEventHandler, r as readBody, h as createError } from '../../../_/nitro.mjs';
import mysql from 'mysql2/promise';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const testConnection_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("[ENVIRONMENT] Testing database connection...");
  const requiredFields = [
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_NAME",
    "DATABASE_USER"
  ];
  const missingFields = requiredFields.filter((field) => !body[field]);
  if (missingFields.length > 0) {
    throw createError({
      statusCode: 400,
      message: `\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F \u043D\u0435 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u044B: ${missingFields.join(", ")}`
    });
  }
  try {
    const connection = await mysql.createConnection({
      host: body.DATABASE_HOST,
      port: parseInt(body.DATABASE_PORT),
      user: body.DATABASE_USER,
      password: body.DATABASE_PASSWORD || "",
      database: body.DATABASE_NAME,
      connectTimeout: 1e4
      // 10 секунд таймаут
    });
    const [rows] = await connection.execute(
      "SELECT 1 as test, DATABASE() as db_name, VERSION() as version"
    );
    await connection.end();
    console.log("[ENVIRONMENT] Database connection test successful");
    return {
      success: true,
      message: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u0431\u0430\u0437\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u0443\u0441\u043F\u0435\u0448\u043D\u043E!",
      details: {
        database: rows[0].db_name,
        version: rows[0].version
      }
    };
  } catch (error) {
    console.error("[ENVIRONMENT] Database connection test failed:", error);
    let errorMessage = "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F";
    switch (error.code) {
      case "ECONNREFUSED":
        errorMessage = "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u043A \u0441\u0435\u0440\u0432\u0435\u0440\u0443 \u0411\u0414. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0445\u043E\u0441\u0442 \u0438 \u043F\u043E\u0440\u0442.";
        break;
      case "ER_ACCESS_DENIED_ERROR":
        errorMessage = "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u0434\u043B\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0411\u0414.";
        break;
      case "ER_BAD_DB_ERROR":
        errorMessage = "\u0411\u0430\u0437\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0435\u0451 \u0447\u0435\u0440\u0435\u0437 \u043F\u0430\u043D\u0435\u043B\u044C \u0445\u043E\u0441\u0442\u0438\u043D\u0433\u0430.";
        break;
      case "ETIMEDOUT":
      case "ENOTFOUND":
        errorMessage = "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0439\u0442\u0438 \u0441\u0435\u0440\u0432\u0435\u0440 \u0411\u0414. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0430\u0434\u0440\u0435\u0441 \u0445\u043E\u0441\u0442\u0430.";
        break;
      default:
        errorMessage = error.message;
    }
    throw createError({
      statusCode: 500,
      message: errorMessage,
      data: {
        code: error.code,
        sqlState: error.sqlState
      }
    });
  }
});

export { testConnection_post as default };
//# sourceMappingURL=test-connection.post.mjs.map
