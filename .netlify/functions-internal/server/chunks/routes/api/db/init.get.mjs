import { t as testConnection, x as runMigrations, d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
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

async function initializeDatabase() {
  console.log("\u{1F504} Initializing database...");
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Failed to connect to database");
    }
    await runMigrations();
    console.log("\u2705 Database initialization completed successfully");
  } catch (error) {
    console.error("\u274C Database initialization failed:", error);
    throw error;
  }
}

const init_get = defineEventHandler(async (event) => {
  try {
    if (true) {
      throw createError({
        statusCode: 403,
        statusMessage: "This endpoint is disabled in production"
      });
    }
    await initializeDatabase();
    return {
      success: true,
      message: "Database initialized successfully",
      data: {
        adminEmail: "admin@atc.uz",
        adminPassword: "admin123",
        warning: "Please change the admin password after first login!"
      }
    };
  } catch (error) {
    console.error("Database initialization error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Database initialization failed",
      data: error.message
    });
  }
});

export { init_get as default };
//# sourceMappingURL=init.get.mjs.map
