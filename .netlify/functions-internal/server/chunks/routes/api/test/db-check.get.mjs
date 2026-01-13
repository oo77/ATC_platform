import { d as defineEventHandler, e as executeQuery } from '../../../nitro/nitro.mjs';
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

const dbCheck_get = defineEventHandler(async (event) => {
  try {
    const [dbInfo] = await executeQuery("SELECT DATABASE() as current_db");
    const userId = "2e825de8-31ee-4faa-b39f-078515721379";
    const [users] = await executeQuery(
      "SELECT id, email, name, role FROM users WHERE id = ?",
      [userId]
    );
    const [instructors] = await executeQuery(
      "SELECT id, full_name, email, user_id FROM instructors WHERE user_id = ?",
      [userId]
    );
    const [allInstructors] = await executeQuery(
      "SELECT id, full_name, email, user_id FROM instructors"
    );
    const envInfo = {
      DATABASE_HOST: process.env.DATABASE_HOST,
      DATABASE_PORT: process.env.DATABASE_PORT,
      DATABASE_USER: process.env.DATABASE_USER,
      DATABASE_NAME: process.env.DATABASE_NAME
    };
    console.log("[DB Check] Current database:", dbInfo[0]?.current_db);
    console.log("[DB Check] ENV:", envInfo);
    console.log("[DB Check] User found:", users.length > 0);
    console.log("[DB Check] Instructor found:", instructors.length > 0);
    console.log("[DB Check] Total instructors:", allInstructors.length);
    return {
      success: true,
      database: dbInfo[0]?.current_db,
      env: envInfo,
      user: users[0] || null,
      instructor: instructors[0] || null,
      allInstructors: allInstructors.map((i) => ({
        id: i.id,
        fullName: i.full_name,
        email: i.email,
        userId: i.user_id
      })),
      totalInstructors: allInstructors.length
    };
  } catch (error) {
    console.error("[DB Check] Error:", error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});

export { dbCheck_get as default };
//# sourceMappingURL=db-check.get.mjs.map
