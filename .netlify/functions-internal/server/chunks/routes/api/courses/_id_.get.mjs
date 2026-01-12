import { d as defineEventHandler, a as getRouterParam } from '../../../nitro/nitro.mjs';
import { g as getCourseById } from '../../../_/courseRepository.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    console.log("[API] Getting course by ID:", id);
    if (!id) {
      console.error("[API] No ID provided");
      return {
        success: false,
        message: "ID \u043A\u0443\u0440\u0441\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const course = await getCourseById(id, true);
    console.log("[API] Course fetched:", course ? "Found" : "Not found");
    if (!course) {
      console.error("[API] Course not found with ID:", id);
      return {
        success: false,
        message: "\u041A\u0443\u0440\u0441 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    return {
      success: true,
      course
    };
  } catch (error) {
    console.error("[API] Error getting course:", error);
    console.error("[API] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043A\u0443\u0440\u0441\u0430",
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
