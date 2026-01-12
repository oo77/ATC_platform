/**
 * Telegram Bot - Инициализация и конфигурация
 * Используется библиотека grammy для работы с Telegram Bot API
 */

import { Bot, Context, InlineKeyboard, Keyboard } from 'grammy';
import type { ReplyKeyboardMarkup } from 'grammy/types';
import type { SessionState } from '../repositories/telegramSessionRepository';

// ============================================================================
// ТИПЫ
// ============================================================================

export interface TelegramBotConfig {
  token: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface FormattedStudent {
  fullName: string;
  groupName: string;
  courseName: string;
  startDate: string;
  endDate: string;
}

export interface FormattedScheduleEvent {
  date: string;
  startTime: string;
  endTime: string;
  eventType: string;
  disciplineName: string;
  instructorName: string;
  location?: string;
  groupName: string;
}

export interface FormattedCertificate {
  id: string;
  studentName: string;
  certificateNumber: string;
  courseName: string;
  groupCode: string;
  issueDate: string;
  status: 'issued' | 'revoked';
  pdfFileUrl: string | null;
  hasPassed: boolean;
  attendancePercent: number | null;
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const BOT_MESSAGES = {
  // Приветствие
  WELCOME: `👋 *Добро пожаловать!*

Я бот учебного центра. Я помогу вам отслеживать информацию о ваших сотрудниках, проходящих обучение.

Для начала работы вам необходимо зарегистрироваться.`,

  // Регистрация
  ASK_NAME: `📝 *Регистрация*

Пожалуйста, введите ваше *ФИО* (Фамилия Имя Отчество):`,

  ASK_PHONE: `📱 *Номер телефона*

Введите ваш номер телефона в формате: *+998XXXXXXXXX*

Или нажмите кнопку ниже, чтобы отправить контакт:`,

  ASK_ORGANIZATION: `🏢 *Выбор организации*

Выберите вашу организацию из списка или введите название, если её нет в списке:`,

  REGISTRATION_COMPLETE: `✅ *Заявка отправлена!*

Ваша заявка на регистрацию успешно отправлена и ожидает одобрения администратором.

Вы получите уведомление, когда заявка будет рассмотрена.

Чтобы проверить статус заявки, используйте команду /status`,

  ALREADY_REGISTERED: `ℹ️ *Вы уже зарегистрированы*

Используйте /status чтобы узнать статус вашей заявки.`,

  // Статусы
  STATUS_PENDING: `⏳ *Статус: Ожидает одобрения*

Ваша заявка находится на рассмотрении у администратора.
Пожалуйста, дождитесь уведомления.`,

  STATUS_APPROVED: `✅ *Статус: Одобрен*

Ваша заявка одобрена! Вам доступны следующие команды:
• /students — список слушателей вашей организации
• /schedule — расписание занятий
• /certificates — сертификаты слушателей`,

  STATUS_BLOCKED: (reason: string) => `🚫 *Статус: Заблокирован*

К сожалению, ваша заявка была отклонена.

*Причина:* ${reason || 'Не указана'}

Если вы считаете это ошибкой, свяжитесь с администратором учебного центра.`,

  // Уведомления
  NOTIFICATION_APPROVED: `🎉 *Поздравляем!*

Ваша заявка на регистрацию была *одобрена*!

Теперь вам доступны команды:
• /students — список слушателей вашей организации
• /schedule — расписание занятий
• /certificates — сертификаты слушателей`,

  NOTIFICATION_BLOCKED: (reason: string) => `❌ *Заявка отклонена*

К сожалению, ваша заявка была отклонена.

*Причина:* ${reason || 'Не указана'}

Если вы считаете это ошибкой, свяжитесь с администратором.`,

  // Ошибки
  ERROR_NO_PERMISSION: `🚫 *Доступ запрещён*

Эта команда доступна только для одобренных представителей организаций.

Используйте /status чтобы проверить статус вашей заявки.`,

  ERROR_NOT_REGISTERED: `❓ *Вы не зарегистрированы*

Для доступа к функциям бота необходимо пройти регистрацию.
Используйте /start для начала регистрации.`,

  ERROR_GENERAL: `⚠️ *Произошла ошибка*

Пожалуйста, попробуйте позже или свяжитесь с администратором.`,

  // Валидация
  INVALID_NAME: `❌ *Неверный формат ФИО*

Пожалуйста, введите полное ФИО (минимум 3 символа).
Например: *Иванов Иван Иванович*`,

  INVALID_PHONE: `❌ *Неверный формат номера*

Пожалуйста, введите номер в формате: *+998XXXXXXXXX*
Например: *+998901234567*`,

  // Помощь
  HELP: `📚 *Справка по командам*

/start — начать работу / регистрация
/status — проверить статус заявки
/students — список слушателей организации
/schedule — расписание занятий
/certificates — сертификаты слушателей
/help — эта справка

*Доступ к командам /students, /schedule и /certificates* предоставляется после одобрения вашей заявки администратором.`,

  // Пустые данные
  NO_STUDENTS: `📭 *Нет слушателей*

В данный момент нет активных слушателей от вашей организации.`,

  NO_SCHEDULE: `📭 *Нет занятий*

В ближайшее время нет запланированных занятий для слушателей вашей организации.`,

  NO_CERTIFICATES: `📭 *Нет сертификатов*

В данный момент нет выданных сертификатов для слушателей вашей организации.`,

  CERTIFICATES_HEADER: `📜 *Сертификаты слушателей вашей организации:*

`,

  CERTIFICATE_SENT: (studentName: string, certificateNumber: string) => 
    `✅ Сертификат *${certificateNumber}* слушателя *${studentName}* отправлен.`,

  CERTIFICATE_SEND_ERROR: (studentName: string) =>
    `❌ Не удалось отправить сертификат слушателя *${studentName}*. Файл не найден.`,

  CERTIFICATE_REQUEST_RECEIVED: `📥 *Запрос на сертификаты получен*

Ваш запрос на получение сертификатов обрабатывается. Файлы будут отправлены в ближайшее время.`,

  CERTIFICATE_SENDING_LIMIT: `⚠️ *Лимит отправки*

Вы можете запросить отправку не более 10 сертификатов за раз. Для получения других сертификатов повторите команду.`,
};

// ============================================================================
// FSM СОСТОЯНИЯ
// ============================================================================

export const SESSION_STATES: Record<SessionState, SessionState> = {
  idle: 'idle',
  awaiting_name: 'awaiting_name',
  awaiting_phone: 'awaiting_phone',
  awaiting_organization: 'awaiting_organization',
  pending_approval: 'pending_approval',
  completed: 'completed',
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Валидация ФИО
 */
export function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 3 && /^[а-яёА-ЯЁa-zA-Z\s\-]+$/u.test(trimmed);
}

/**
 * Валидация телефона (узбекистанский формат)
 */
export function validatePhone(phone: string): boolean {
  // Удаляем все кроме цифр и +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Формат: +998XXXXXXXXX (12 символов)
  return /^\+998\d{9}$/.test(cleaned);
}

/**
 * Нормализация телефона
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Если начинается с 998 без +, добавляем +
  if (cleaned.startsWith('998') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // Если начинается с 8 или 9 (местный формат)
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '+998' + cleaned;
  }
  
  return cleaned;
}

/**
 * Форматирование даты для отображения
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Форматирование времени
 */
export function formatTime(time: string): string {
  // Предполагаем формат HH:mm или HH:mm:ss
  return time.substring(0, 5);
}

/**
 * Форматирование списка студентов по группам
 */
export function formatStudentsList(students: FormattedStudent[]): string {
  if (students.length === 0) {
    return BOT_MESSAGES.NO_STUDENTS;
  }

  // Группируем по группам
  const byGroup = students.reduce((acc, student) => {
    const key = student.groupName;
    if (!acc[key]) {
      acc[key] = {
        courseName: student.courseName,
        startDate: student.startDate,
        endDate: student.endDate,
        students: [],
      };
    }
    acc[key].students.push(student.fullName);
    return acc;
  }, {} as Record<string, { courseName: string; startDate: string; endDate: string; students: string[] }>);

  let message = '📚 *Слушатели вашей организации:*\n\n';
  let totalStudents = 0;

  for (const [groupName, group] of Object.entries(byGroup)) {
    message += `*Группа: ${groupName}* (${group.startDate} - ${group.endDate})\n`;
    message += `📖 _${group.courseName}_\n`;
    
    group.students.forEach((name, index) => {
      const prefix = index === group.students.length - 1 ? '└' : '├';
      message += `${prefix} ${name}\n`;
      totalStudents++;
    });
    
    message += '\n';
  }

  message += `*Всего слушателей:* ${totalStudents}`;

  return message;
}

/**
 * Форматирование расписания
 */
export function formatSchedule(events: FormattedScheduleEvent[]): string {
  if (events.length === 0) {
    return BOT_MESSAGES.NO_SCHEDULE;
  }

  // Группируем по дате
  const byDate = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, FormattedScheduleEvent[]>);

  let message = '📅 *Расписание занятий:*\n\n';

  for (const [date, dateEvents] of Object.entries(byDate)) {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
    message += `🗓 *${formatDate(date)}* (${dayName})\n\n`;

    for (const event of dateEvents) {
      const typeEmoji = event.eventType === 'theory' ? '📖' : 
                        event.eventType === 'practice' ? '💻' : '📝';
      const typeName = event.eventType === 'theory' ? 'Теория' :
                       event.eventType === 'practice' ? 'Практика' : 'Проверка знаний';
      
      message += `${event.startTime} - ${event.endTime} | ${typeName}\n`;
      message += `${typeEmoji} ${event.disciplineName}\n`;
      message += `👨‍🏫 Преподаватель: ${event.instructorName}\n`;
      if (event.location) {
        message += `🚪 Аудитория: ${event.location}\n`;
      }
      message += `👥 Группа: ${event.groupName}\n\n`;
    }
  }

  return message;
}

/**
 * Форматирование списка сертификатов
 */
export function formatCertificatesList(certificates: FormattedCertificate[]): string {
  if (certificates.length === 0) {
    return BOT_MESSAGES.NO_CERTIFICATES;
  }

  let message = BOT_MESSAGES.CERTIFICATES_HEADER;
  let totalIssued = 0;
  let totalRevoked = 0;

  // Группируем по курсам
  const byCourse = certificates.reduce((acc, cert) => {
    const key = `${cert.courseName} (${cert.groupCode})`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(cert);
    return acc;
  }, {} as Record<string, FormattedCertificate[]>);

  for (const [courseGroup, certs] of Object.entries(byCourse)) {
    message += `📚 *${courseGroup}*\n`;
    
    for (const cert of certs) {
      const statusIcon = cert.status === 'issued' ? '✅' : '❌';
      const passedIcon = cert.hasPassed ? '🎓' : '⚠️';
      const passedText = cert.hasPassed ? 'Прошёл обучение' : 'Не соответствует требованиям';
      
      message += `${statusIcon} *${cert.studentName}*\n`;
      message += `   📜 № ${cert.certificateNumber}\n`;
      message += `   📅 Выдан: ${cert.issueDate}\n`;
      message += `   ${passedIcon} ${passedText}`;
      
      if (cert.attendancePercent !== null && cert.attendancePercent !== undefined) {
        const percent = Number(cert.attendancePercent);
        if (!isNaN(percent)) {
          message += ` (посещ.: ${percent.toFixed(0)}%)`;
        }
      }
      message += '\n';
      
      if (cert.status === 'revoked') {
        message += `   ⛔ _Сертификат отозван_\n`;
        totalRevoked++;
      } else {
        totalIssued++;
      }
      
      message += '\n';
    }
  }

  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `*Итого:* ${certificates.length} сертификатов\n`;
  message += `✅ Активных: ${totalIssued} | ❌ Отозвано: ${totalRevoked}\n\n`;
  message += `_Для получения файла сертификата ответьте номером сертификата или используйте кнопки ниже._`;

  return message;
}

/**
 * Создание клавиатуры с кнопкой отправки контакта
 */
export function createPhoneKeyboard(): InlineKeyboard {
  // Для отправки контакта нужна обычная клавиатура, не inline
  // Это делается через ReplyKeyboardMarkup в grammy
  return new InlineKeyboard();
}

/**
 * Создание клавиатуры с организациями
 */
export function createOrganizationsKeyboard(organizations: { id: string; name: string }[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  organizations.forEach((org, index) => {
    keyboard.text(org.name, `org_${org.id}`);
    // По 1 кнопке в ряд для лучшей читаемости
    if (index < organizations.length - 1) {
      keyboard.row();
    }
  });
  
  return keyboard;
}

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ БОТА
// ============================================================================

let botInstance: Bot<Context> | null = null;

/**
 * Получить или создать экземпляр бота
 */
export function getBot(): Bot<Context> | null {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('[TelegramBot] TELEGRAM_BOT_TOKEN не задан в переменных окружения');
      return null;
    }
    
    botInstance = new Bot(token);
    console.log('[TelegramBot] Бот инициализирован');
  }
  
  return botInstance;
}

/**
 * Отправить сообщение пользователю
 */
export async function sendMessage(
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: 'Markdown' | 'HTML';
    replyMarkup?: InlineKeyboard | ReplyKeyboardMarkup | { remove_keyboard: true };
  }
): Promise<boolean> {
  const bot = getBot();
  if (!bot) {
    console.error('[TelegramBot] Бот не инициализирован');
    return false;
  }

  try {
    await bot.api.sendMessage(chatId, text, {
      parse_mode: options?.parseMode || 'Markdown',
      reply_markup: options?.replyMarkup,
    });
    return true;
  } catch (error) {
    console.error('[TelegramBot] Ошибка отправки сообщения:', error);
    return false;
  }
}

/**
 * Отправить сообщение с кнопкой "Отправить контакт"
 */
export async function sendMessageWithContactButton(
  chatId: string | number,
  text: string
): Promise<boolean> {
  const bot = getBot();
  if (!bot) {
    console.error('[TelegramBot] Бот не инициализирован');
    return false;
  }

  try {
    const keyboard = new Keyboard()
      .requestContact('📱 Отправить мой контакт')
      .resized()
      .oneTime();

    await bot.api.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
    return true;
  } catch (error) {
    console.error('[TelegramBot] Ошибка отправки сообщения с контактом:', error);
    return false;
  }
}

/**
 * Убрать клавиатуру после ввода
 */
export async function removeKeyboard(
  chatId: string | number,
  text: string
): Promise<boolean> {
  return sendMessage(chatId, text, {
    replyMarkup: { remove_keyboard: true },
  });
}

/**
 * Проверка секрета вебхука
 */
export function verifyWebhookSecret(secret: string): boolean {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.warn('[TelegramBot] TELEGRAM_WEBHOOK_SECRET не задан');
    return true; // В dev-режиме пропускаем проверку
  }
  return secret === expectedSecret;
}
