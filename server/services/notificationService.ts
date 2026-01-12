/**
 * Notification Service - Сервис уведомлений через Telegram
 * Отправка уведомлений представителям и администраторам
 */

import { sendMessage, BOT_MESSAGES, formatDate } from '../utils/telegramBot';
import { getRepresentativeById, type Representative } from '../repositories/representativeRepository';

// ============================================================================
// УВЕДОМЛЕНИЯ ДЛЯ ПРЕДСТАВИТЕЛЕЙ
// ============================================================================

/**
 * Уведомить представителя об одобрении заявки
 */
export async function notifyRepresentativeAboutApproval(
  representativeId: string
): Promise<boolean> {
  try {
    const representative = await getRepresentativeById(representativeId);
    
    if (!representative || !representative.telegramChatId) {
      console.warn(`[NotificationService] Представитель ${representativeId} не найден или нет Telegram`);
      return false;
    }

    const result = await sendMessage(
      representative.telegramChatId,
      BOT_MESSAGES.NOTIFICATION_APPROVED
    );

    console.log(`[NotificationService] Уведомление об одобрении отправлено: ${representativeId}`);
    return result;
  } catch (error) {
    console.error('[NotificationService] Ошибка отправки уведомления об одобрении:', error);
    return false;
  }
}

/**
 * Уведомить представителя о блокировке
 */
export async function notifyRepresentativeAboutBlock(
  representativeId: string,
  reason: string
): Promise<boolean> {
  try {
    const representative = await getRepresentativeById(representativeId);
    
    if (!representative || !representative.telegramChatId) {
      console.warn(`[NotificationService] Представитель ${representativeId} не найден или нет Telegram`);
      return false;
    }

    const result = await sendMessage(
      representative.telegramChatId,
      BOT_MESSAGES.NOTIFICATION_BLOCKED(reason)
    );

    console.log(`[NotificationService] Уведомление о блокировке отправлено: ${representativeId}`);
    return result;
  } catch (error) {
    console.error('[NotificationService] Ошибка отправки уведомления о блокировке:', error);
    return false;
  }
}

/**
 * Уведомить представителя о зачислении слушателя в группу
 */
export async function notifyAboutStudentEnrollment(
  representativeId: string,
  studentName: string,
  groupName: string,
  courseName: string
): Promise<boolean> {
  try {
    const representative = await getRepresentativeById(representativeId);
    
    if (!representative || !representative.telegramChatId || !representative.notificationsEnabled) {
      return false;
    }

    if (representative.status !== 'approved') {
      return false;
    }

    const message = `📝 *Зачисление в группу*

Слушатель вашей организации зачислен в группу обучения:

👤 *Слушатель:* ${studentName}
👥 *Группа:* ${groupName}
📚 *Курс:* ${courseName}`;

    const result = await sendMessage(representative.telegramChatId, message);
    
    console.log(`[NotificationService] Уведомление о зачислении отправлено: ${representativeId}`);
    return result;
  } catch (error) {
    console.error('[NotificationService] Ошибка отправки уведомления о зачислении:', error);
    return false;
  }
}

/**
 * Уведомить представителя об изменении расписания
 */
export async function notifyAboutScheduleChange(
  representativeId: string,
  groupName: string,
  changeType: 'added' | 'updated' | 'cancelled',
  eventDetails: {
    date: string;
    time: string;
    disciplineName: string;
  }
): Promise<boolean> {
  try {
    const representative = await getRepresentativeById(representativeId);
    
    if (!representative || !representative.telegramChatId || !representative.notificationsEnabled) {
      return false;
    }

    if (representative.status !== 'approved') {
      return false;
    }

    const changeEmoji = changeType === 'added' ? '➕' : changeType === 'updated' ? '🔄' : '❌';
    const changeText = changeType === 'added' ? 'Добавлено занятие' : 
                       changeType === 'updated' ? 'Изменено занятие' : 'Отменено занятие';

    const message = `📅 *Изменение в расписании*

${changeEmoji} *${changeText}*

👥 *Группа:* ${groupName}
📆 *Дата:* ${eventDetails.date}
🕐 *Время:* ${eventDetails.time}
📖 *Дисциплина:* ${eventDetails.disciplineName}`;

    const result = await sendMessage(representative.telegramChatId, message);
    
    console.log(`[NotificationService] Уведомление об изменении расписания отправлено: ${representativeId}`);
    return result;
  } catch (error) {
    console.error('[NotificationService] Ошибка отправки уведомления об изменении расписания:', error);
    return false;
  }
}

/**
 * Уведомить представителя о завершении обучения слушателем
 */
export async function notifyAboutCourseCompletion(
  representativeId: string,
  studentName: string,
  courseName: string,
  completionDate: Date
): Promise<boolean> {
  try {
    const representative = await getRepresentativeById(representativeId);
    
    if (!representative || !representative.telegramChatId || !representative.notificationsEnabled) {
      return false;
    }

    if (representative.status !== 'approved') {
      return false;
    }

    const message = `🎓 *Завершение обучения*

Слушатель вашей организации завершил обучение:

👤 *Слушатель:* ${studentName}
📚 *Курс:* ${courseName}
📆 *Дата завершения:* ${formatDate(completionDate)}

Поздравляем с успешным завершением обучения!`;

    const result = await sendMessage(representative.telegramChatId, message);
    
    console.log(`[NotificationService] Уведомление о завершении обучения отправлено: ${representativeId}`);
    return result;
  } catch (error) {
    console.error('[NotificationService] Ошибка отправки уведомления о завершении обучения:', error);
    return false;
  }
}

// ============================================================================
// УВЕДОМЛЕНИЯ ДЛЯ АДМИНИСТРАТОРОВ
// ============================================================================

/**
 * Уведомить администраторов о новой заявке на регистрацию
 * Примечание: требует список chat_id администраторов в БД или конфиге
 */
export async function notifyAdminsAboutNewRepresentative(
  representative: {
    fullName: string;
    phone: string;
    organizationName: string;
  }
): Promise<boolean> {
  try {
    // TODO: Получить список Telegram chat_id администраторов из БД
    // Пока это заглушка - реальная реализация требует хранения chat_id админов
    
    const adminChatIds = process.env.TELEGRAM_ADMIN_CHAT_IDS?.split(',').filter(Boolean) || [];
    
    if (adminChatIds.length === 0) {
      console.log('[NotificationService] Нет chat_id администраторов для уведомления');
      return false;
    }

    const message = `🔔 *Новая заявка на регистрацию*

Поступила заявка от представителя организации:

👤 *ФИО:* ${representative.fullName}
📱 *Телефон:* ${representative.phone}
🏢 *Организация:* ${representative.organizationName}

Перейдите в панель управления для рассмотрения заявки.`;

    let successCount = 0;
    for (const chatId of adminChatIds) {
      const result = await sendMessage(chatId.trim(), message);
      if (result) successCount++;
    }

    console.log(`[NotificationService] Уведомления админам отправлены: ${successCount}/${adminChatIds.length}`);
    return successCount > 0;
  } catch (error) {
    console.error('[NotificationService] Ошибка отправки уведомления админам:', error);
    return false;
  }
}

// ============================================================================
// МАССОВЫЕ УВЕДОМЛЕНИЯ
// ============================================================================

/**
 * Отправить уведомление всем представителям организации
 */
export async function notifyAllRepresentativesOfOrganization(
  organizationId: string,
  message: string
): Promise<{ success: number; failed: number }> {
  const { getRepresentativesByOrganization } = await import('../repositories/representativeRepository');
  
  const representatives = await getRepresentativesByOrganization(organizationId);
  const activeReps = representatives.filter(r => 
    r.status === 'approved' && 
    r.telegramChatId && 
    r.notificationsEnabled
  );

  let success = 0;
  let failed = 0;

  for (const rep of activeReps) {
    if (rep.telegramChatId) {
      const result = await sendMessage(rep.telegramChatId, message);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }
  }

  return { success, failed };
}

/**
 * Отправить тестовое сообщение представителю
 */
export async function sendTestMessage(
  representativeId: string
): Promise<boolean> {
  try {
    const representative = await getRepresentativeById(representativeId);
    
    if (!representative || !representative.telegramChatId) {
      return false;
    }

    const message = `🔔 *Тестовое сообщение*

Это тестовое сообщение от учебного центра.
Если вы получили это сообщение, уведомления работают корректно.`;

    return await sendMessage(representative.telegramChatId, message);
  } catch (error) {
    console.error('[NotificationService] Ошибка отправки тестового сообщения:', error);
    return false;
  }
}
