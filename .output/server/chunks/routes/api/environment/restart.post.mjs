import { g as defineEventHandler } from '../../../_/nitro.mjs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
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

const restart_post = defineEventHandler(async (event) => {
  console.log("[ENVIRONMENT] Restarting application...");
  try {
    const restartFilePath = join(process.cwd(), "tmp", "restart.txt");
    await writeFile(restartFilePath, (/* @__PURE__ */ new Date()).toISOString());
    console.log("[ENVIRONMENT] Restart file updated, application will restart");
    return {
      success: true,
      message: "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F...",
      note: "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434"
    };
  } catch (error) {
    console.error("[ENVIRONMENT] Failed to restart application:", error);
    return {
      success: false,
      message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
      instruction: "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u0447\u0435\u0440\u0435\u0437 cPanel: Node.js App \u2192 Restart"
    };
  }
});

export { restart_post as default };
//# sourceMappingURL=restart.post.mjs.map
