import { d as defineEventHandler, g as getQuery } from '../../../nitro/nitro.mjs';
import { j as getGroupsForSelect } from '../../../_/groupRepository.mjs';
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

const select_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const excludeGroupId = query.excludeGroupId;
    const groups = await getGroupsForSelect(excludeGroupId);
    return {
      success: true,
      groups
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u0433\u0440\u0443\u043F\u043F:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0433\u0440\u0443\u043F\u043F",
      groups: []
    };
  }
});

export { select_get as default };
//# sourceMappingURL=select.get.mjs.map
