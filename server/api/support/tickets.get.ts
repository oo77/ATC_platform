import { getUserTickets } from '../../repositories/supportTicketRepository';

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const tickets = await getUserTickets(user.id);
    return tickets;
  } catch (error: any) {
    console.error('Failed to get user tickets:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve tickets',
    });
  }
});
