import { d as defineEventHandler, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { c as createSupportTicket } from '../../../_/supportTicketRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
import { z } from 'zod';
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
import '../../../_/activityLogRepository.mjs';

const createTicketSchema = z.object({
  ticket_type: z.enum(["technical", "question", "feature", "bug", "other"]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  subject: z.string().min(3).max(255),
  description: z.string().min(10),
  attachments: z.any().optional()
});
const tickets_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  const body = await readBody(event);
  const result = createTicketSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.errors
    });
  }
  try {
    const ticketData = {
      user_id: user.id,
      ...result.data
    };
    const newTicket = await createSupportTicket(ticketData);
    await logActivity(event, {
      action: "CREATE",
      entityType: "SYSTEM",
      // Используем SYSTEM так как нет спец типа TICKET
      entityId: newTicket.id,
      details: {
        type: "support_ticket",
        subject: newTicket.subject
      }
    });
    return newTicket;
  } catch (error) {
    console.error("Failed to create support ticket:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create ticket"
    });
  }
});

export { tickets_post as default };
//# sourceMappingURL=tickets.post.mjs.map
