import { d as defineEventHandler, P as getPendingRepresentatives } from '../../../nitro/nitro.mjs';
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

const pending_get = defineEventHandler(async (event) => {
  try {
    const pending = await getPendingRepresentatives();
    return {
      success: true,
      data: pending,
      count: pending.length
    };
  } catch (error) {
    console.error("Error fetching pending representatives:", error);
    return {
      success: false,
      data: [],
      count: 0
    };
  }
});

export { pending_get as default };
//# sourceMappingURL=pending.get.mjs.map
