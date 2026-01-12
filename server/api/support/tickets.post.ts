import { createSupportTicket, type CreateSupportTicketInput } from '../../repositories/supportTicketRepository';
import { logActivity } from '../../utils/activityLogger';
import { z } from 'zod';

const createTicketSchema = z.object({
  ticket_type: z.enum(['technical', 'question', 'feature', 'bug', 'other']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  subject: z.string().min(3).max(255),
  description: z.string().min(10),
  attachments: z.any().optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const result = createTicketSchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.errors,
    });
  }

  try {
    const ticketData: CreateSupportTicketInput = {
      user_id: user.id,
      ...result.data,
    };

    const newTicket = await createSupportTicket(ticketData);

    await logActivity(event, {
      action: 'CREATE',
      entityType: 'SYSTEM', // Используем SYSTEM так как нет спец типа TICKET
      entityId: newTicket.id,
      details: { 
        type: 'support_ticket',
        subject: newTicket.subject 
      },
    });

    return newTicket;
  } catch (error: any) {
    console.error('Failed to create support ticket:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create ticket',
    });
  }
});
