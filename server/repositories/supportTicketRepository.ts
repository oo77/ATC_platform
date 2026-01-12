/**
 * Репозиторий для работы с тикетами поддержки
 */

import { executeQuery } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_type: 'technical' | 'question' | 'feature' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high';
  subject: string;
  description: string;
  attachments?: any | null; // JSON
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string | null;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date | null;
}

export type CreateSupportTicketInput = Pick<
  SupportTicket,
  'user_id' | 'ticket_type' | 'priority' | 'subject' | 'description' | 'attachments'
>;

interface SupportTicketRow extends RowDataPacket, SupportTicket {}

/**
 * Создание нового тикета поддержки
 */
export async function createSupportTicket(data: CreateSupportTicketInput): Promise<SupportTicket> {
  const id = uuidv4();
  
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

  // Возвращаем созданный тикет
  const row = await getTicketById(id);
  if (!row) throw new Error('Failed to create support ticket');
  
  return row;
}

/**
 * Получение тикета по ID
 */
export async function getTicketById(id: string): Promise<SupportTicket | null> {
  const rows = await executeQuery<SupportTicketRow[]>(
    'SELECT * FROM support_tickets WHERE id = ? LIMIT 1',
    [id]
  );
  
  if (rows.length === 0) return null;
  
  // Парсинг JSON поля attachments если оно string
  const ticket = rows[0];
  if (typeof ticket.attachments === 'string') {
    try {
      ticket.attachments = JSON.parse(ticket.attachments);
    } catch (e) {
      ticket.attachments = null;
    }
  }
  
  return ticket;
}

/**
 * Получение всех тикетов пользователя
 */
export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
  const rows = await executeQuery<SupportTicketRow[]>(
    'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  
  return rows.map(ticket => {
    if (typeof ticket.attachments === 'string') {
      try {
        ticket.attachments = JSON.parse(ticket.attachments);
      } catch (e) {
        ticket.attachments = null;
      }
    }
    return ticket;
  });
}

/**
 * Получение всех тикетов (для админов) с фильтрацией
 */
export async function getAllTickets(status?: string): Promise<SupportTicket[]> {
  let query = 'SELECT * FROM support_tickets';
  const params: any[] = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const rows = await executeQuery<SupportTicketRow[]>(query, params);
  
  return rows.map(ticket => {
    if (typeof ticket.attachments === 'string') {
      try {
        ticket.attachments = JSON.parse(ticket.attachments);
      } catch (e) {
        ticket.attachments = null;
      }
    }
    return ticket;
  });
}
