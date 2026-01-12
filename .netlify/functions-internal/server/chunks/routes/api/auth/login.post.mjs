import { d as defineEventHandler, r as readBody, c as createError, t as testConnection, e as executeQuery, v as verifyPassword, b as createTokenPayload, f as generateToken, h as generateRefreshToken, i as toPublicUser } from '../../../nitro/nitro.mjs';
import { v as validate, l as loginSchema } from '../../../_/validation.mjs';
import { a as logActivityDirect } from '../../../_/activityLogger.mjs';
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
import 'zod';
import '../../../_/activityLogRepository.mjs';

const login_post = defineEventHandler(async (event) => {
  const debugInfo = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env: {
      NODE_ENV: "production",
      DATABASE_HOST: process.env.DATABASE_HOST ? "\u2713 set" : "\u2717 missing",
      DATABASE_PORT: process.env.DATABASE_PORT ? "\u2713 set" : "\u2717 missing",
      DATABASE_USER: process.env.DATABASE_USER ? "\u2713 set" : "\u2717 missing",
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? "\u2713 set (hidden)" : "\u2717 missing",
      DATABASE_NAME: process.env.DATABASE_NAME ? "\u2713 set" : "\u2717 missing",
      DATABASE_SSL: process.env.DATABASE_SSL,
      DATABASE_SSL_CA: process.env.DATABASE_SSL_CA ? "\u2713 set (length: " + process.env.DATABASE_SSL_CA.length + ")" : "\u2717 missing"
    },
    steps: []
  };
  console.log("\u{1F50D} [DEBUG] Login attempt started");
  console.log("\u{1F50D} [DEBUG] Environment check:", JSON.stringify(debugInfo.env, null, 2));
  try {
    const body = await readBody(event);
    debugInfo.steps.push("1. Body read successfully");
    console.log("\u{1F50D} [DEBUG] Step 1: Body read, email:", body?.email);
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      debugInfo.steps.push("2. Validation FAILED");
      console.log("\u{1F50D} [DEBUG] Step 2: Validation failed:", validation.errors);
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        data: {
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
          errors: validation.errors,
          debug: debugInfo
          // Include debug info in response
        }
      });
    }
    debugInfo.steps.push("2. Validation passed");
    console.log("\u{1F50D} [DEBUG] Step 2: Validation passed");
    const { email, password } = validation.data;
    console.log("\u{1F50D} [DEBUG] Step 3: Testing DB connection...");
    try {
      const dbConnected = await testConnection();
      debugInfo.steps.push(`3. DB connection test: ${dbConnected ? "SUCCESS" : "FAILED"}`);
      debugInfo.dbConnected = dbConnected;
      console.log("\u{1F50D} [DEBUG] Step 3: DB connection:", dbConnected);
    } catch (dbError) {
      debugInfo.steps.push(`3. DB connection test: ERROR - ${dbError.message}`);
      debugInfo.dbError = dbError.message;
      console.error("\u{1F50D} [DEBUG] Step 3: DB connection error:", dbError.message);
      throw createError({
        statusCode: 500,
        statusMessage: "Database Connection Error",
        data: {
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A \u0431\u0430\u0437\u0435 \u0434\u0430\u043D\u043D\u044B\u0445",
          debug: debugInfo
        }
      });
    }
    console.log("\u{1F50D} [DEBUG] Step 4: Querying user by email...");
    const users = await executeQuery(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    debugInfo.steps.push(`4. User query: found ${users.length} users`);
    console.log("\u{1F50D} [DEBUG] Step 4: Found users:", users.length);
    if (users.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid Credentials",
        data: {
          success: false,
          message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C",
          errors: { _general: ["\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C"] },
          debug: debugInfo
        }
      });
    }
    const user = users[0];
    debugInfo.steps.push(`5. User found: ${user.email} (role: ${user.role})`);
    console.log("\u{1F50D} [DEBUG] Step 5: User found:", user.email, "role:", user.role);
    console.log("\u{1F50D} [DEBUG] Step 6: Verifying password...");
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    debugInfo.steps.push(`6. Password verification: ${isPasswordValid ? "VALID" : "INVALID"}`);
    console.log("\u{1F50D} [DEBUG] Step 6: Password valid:", isPasswordValid);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid Credentials",
        data: {
          success: false,
          message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C",
          errors: { _general: ["\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 email \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C"] },
          debug: debugInfo
        }
      });
    }
    console.log("\u{1F50D} [DEBUG] Step 7: Generating tokens...");
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    debugInfo.steps.push("7. Tokens generated successfully");
    console.log("\u{1F50D} [DEBUG] Step 7: Tokens generated");
    const response = {
      success: true,
      user: toPublicUser(user),
      token,
      refreshToken
    };
    console.log(`\u2705 User logged in: ${user.email} (${user.role})`);
    console.log("\u{1F50D} [DEBUG] Login SUCCESS! All steps completed:", debugInfo.steps);
    await logActivityDirect(
      user.id,
      "LOGIN",
      "SYSTEM",
      user.id,
      user.name
    );
    return response;
  } catch (error) {
    console.error("\u274C [DEBUG] Login error:", error.message);
    console.error("\u274C [DEBUG] Error stack:", error.stack);
    console.error("\u274C [DEBUG] Debug info:", JSON.stringify(debugInfo, null, 2));
    if (error.statusCode) {
      if (error.data) {
        error.data.debug = debugInfo;
      }
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Login Failed",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u0445\u043E\u0434\u0435 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443",
        errorMessage: error.message,
        debug: debugInfo
      }
    });
  }
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
