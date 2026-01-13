import { d as defineEventHandler, c as createError } from '../../../_/nitro.mjs';
import { g as getUserTickets } from '../../../_/supportTicketRepository.mjs';
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

const tickets_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const tickets = await getUserTickets(user.id);
    return tickets;
  } catch (error) {
    console.error("Failed to get user tickets:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve tickets"
    });
  }
});

export { tickets_get as default };
//# sourceMappingURL=tickets.get.mjs.map
