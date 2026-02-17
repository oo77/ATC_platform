import { f as executeQuery } from './nitro.mjs';
import { v4 } from 'uuid';

async function createSupportTicket(data) {
  const id = v4();
  await executeQuery(
    `INSERT INTO support_tickets (
      id, user_id, ticket_type, priority, subject, description, attachments
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.user_id,
      data.ticket_type,
      data.priority,
      data.subject,
      data.description,
      data.attachments ? JSON.stringify(data.attachments) : null
    ]
  );
  const row = await getTicketById(id);
  if (!row) throw new Error("Failed to create support ticket");
  return row;
}
async function getTicketById(id) {
  const rows = await executeQuery(
    "SELECT * FROM support_tickets WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) return null;
  const ticket = rows[0];
  if (!ticket) return null;
  if (typeof ticket.attachments === "string") {
    try {
      ticket.attachments = JSON.parse(ticket.attachments);
    } catch (e) {
      ticket.attachments = null;
    }
  }
  return ticket;
}
async function getUserTickets(userId) {
  const rows = await executeQuery(
    "SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows.map((ticket) => {
    if (typeof ticket.attachments === "string") {
      try {
        ticket.attachments = JSON.parse(ticket.attachments);
      } catch (e) {
        ticket.attachments = null;
      }
    }
    return ticket;
  });
}

export { createSupportTicket as c, getUserTickets as g };
//# sourceMappingURL=supportTicketRepository.mjs.map
