/**
 * Telegram Bot Service - Логика обработки сообщений
 * FSM регистрации и обработчики команд
 */

import {
  getBot,
  sendMessage,
  sendMessageWithContactButton,
  BOT_MESSAGES,
  validateName,
  validatePhone,
  normalizePhone,
  formatStudentsList,
  formatSchedule,
  formatCertificatesList,
  createOrganizationsKeyboard,
  type FormattedStudent,
  type FormattedScheduleEvent,
  type FormattedCertificate,
} from '../utils/telegramBot';
import {
  getOrCreateSession,
  updateSession,
  deleteSession,
  type SessionState,
} from '../repositories/telegramSessionRepository';
import {
  createRepresentative,
  getRepresentativeByTelegramChatId,
  updateLastActivity,
  type Representative,
} from '../repositories/representativeRepository';
import {
  getAllOrganizations,
  getOrganizationById,
  searchOrganizations,
  getOrCreateOrganizationByName,
} from '../repositories/organizationRepository';

// ============================================================================
// ТИПЫ
// ============================================================================

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  date: number;
  text?: string;
  contact?: {
    phone_number: string;
    first_name: string;
    last_name?: string;
    user_id?: number;
  };
}

interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  message?: TelegramMessage;
  chat_instance: string;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ============================================================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ============================================================================

/**
 * Обработать входящее обновление от Telegram
 */
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  try {
    // Обработка callback query (нажатие inline кнопки)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // Обработка текстового сообщения
    if (update.message) {
      await handleMessage(update.message);
      return;
    }

    console.log('[TelegramBot] Неизвестный тип обновления:', update);
  } catch (error) {
    console.error('[TelegramBot] Ошибка обработки обновления:', error);
  }
}

/**
 * Обработать текстовое сообщение
 */
async function handleMessage(message: TelegramMessage): Promise<void> {
  const chatId = String(message.chat.id);
  const text = message.text?.trim() || '';
  const username = message.from?.username || null;

  console.log(`[TelegramBot] Сообщение от ${chatId}: ${text}`);

  // Обработка команд
  if (text.startsWith('/')) {
    await handleCommand(chatId, text, username);
    return;
  }

  // Обработка контакта (отправка номера телефона)
  if (message.contact) {
    await handleContactMessage(chatId, message.contact.phone_number, username);
    return;
  }

  // Обработка обычного текста в зависимости от состояния FSM
  await handleTextMessage(chatId, text, username);
}

/**
 * Обработать команду
 */
async function handleCommand(chatId: string, command: string, username: string | null): Promise<void> {
  // Убираем @ и имя бота если есть
  const cleanCommand = command.split('@')[0].toLowerCase();

  switch (cleanCommand) {
    case '/start':
      await commandStart(chatId, username);
      break;
    case '/status':
      await commandStatus(chatId);
      break;
    case '/students':
      await commandStudents(chatId);
      break;
    case '/schedule':
      await commandSchedule(chatId);
      break;
    case '/certificates':
      await commandCertificates(chatId);
      break;
    case '/help':
      await commandHelp(chatId);
      break;
    default:
      await sendMessage(chatId, BOT_MESSAGES.HELP);
  }
}

// ============================================================================
// КОМАНДЫ
// ============================================================================

/**
 * Команда /start - начало работы
 */
async function commandStart(chatId: string, username: string | null): Promise<void> {
  // Проверяем, зарегистрирован ли уже пользователь
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (representative) {
    // Уже зарегистрирован - показываем статус
    await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
    await commandStatus(chatId);
    return;
  }

  // Начинаем регистрацию
  const session = await getOrCreateSession(chatId);
  
  // Отправляем приветствие
  await sendMessage(chatId, BOT_MESSAGES.WELCOME);
  
  // Переводим в состояние ожидания ФИО
  await updateSession(chatId, {
    state: 'awaiting_name',
    data: { username },
  });
  
  await sendMessage(chatId, BOT_MESSAGES.ASK_NAME);
  
  console.log(`[TelegramBot] Начата регистрация для chatId: ${chatId}`);
}

/**
 * Команда /status - статус заявки
 */
async function commandStatus(chatId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative) {
    // Проверяем, может быть в процессе регистрации
    const session = await getOrCreateSession(chatId);
    
    if (session.state === 'pending_approval') {
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
    } else {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_NOT_REGISTERED);
    }
    return;
  }

  switch (representative.status) {
    case 'pending':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
      break;
    case 'approved':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_APPROVED);
      await updateLastActivity(representative.id);
      break;
    case 'blocked':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_BLOCKED(representative.blockedReason || ''));
      break;
  }
}

/**
 * Команда /students - список слушателей
 * Показывает кнопки фильтра по курсу и периоду
 */
async function commandStudents(chatId: string): Promise<void> {
  const startTime = Date.now();
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  // Проверяем разрешение
  if (!representative.permissions.can_view_students) {
    await sendMessage(chatId, '🚫 *Нет доступа*\n\nУ вас нет разрешения на просмотр списка слушателей. Обратитесь к администратору учебного центра.');
    
    // Логируем отказ
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/students',
      status: 'denied',
      errorMessage: 'Нет разрешения can_view_students',
      responseTimeMs: Date.now() - startTime,
    });
    
    return;
  }

  try {
    // Получаем студентов организации
    const students = await getStudentsForRepresentative(representative);
    
    if (students.length === 0) {
      await sendMessage(chatId, BOT_MESSAGES.NO_STUDENTS);
      return;
    }
    
    // Группируем по курсам
    const courses = new Set<string>();
    for (const student of students) {
      if (student.courseName) {
        courses.add(student.courseName);
      }
    }
    
    // Создаём список курсов с индексами
    const sortedCourses = Array.from(courses).slice(0, 6);
    
    // Создаём клавиатуру с курсами
    const { InlineKeyboard } = await import('grammy');
    const keyboard = new InlineKeyboard();
    
    // Кнопка "Все слушатели"
    keyboard.text('📋 Все слушатели', 'stc_all');
    keyboard.row();
    
    // Добавляем кнопки курсов (используем индекс для короткого callback_data)
    for (let i = 0; i < sortedCourses.length; i++) {
      const course = sortedCourses[i]!;
      const shortName = course.length > 25 ? course.substring(0, 22) + '...' : course;
      // Используем индекс вместо полного названия курса
      keyboard.text(`📚 ${shortName}`, `stc_${i}`);
      keyboard.row();
    }
    
    // Сохраняем маппинг курсов в сессию для последующего использования
    await updateSession(chatId, {
      data: { coursesList: sortedCourses }
    });
    
    await sendMessage(chatId, '👥 *Список слушателей*\n\nВыберите курс для просмотра:', { replyMarkup: keyboard });
    await updateLastActivity(representative.id);
    
    // Логируем успешный запрос
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/students',
      status: 'success',
      requestData: { studentsCount: students.length, coursesCount: courses.size },
      responseTimeMs: Date.now() - startTime,
    });
    
    console.log(`[TelegramBot] Слушатели: показаны курсы (${courses.size}) для chatId: ${chatId}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения студентов:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    
    // Логируем ошибку
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/students',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    });
  }
}


/**
 * Команда /schedule - расписание
 */
async function commandSchedule(chatId: string): Promise<void> {
  const startTime = Date.now();
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  // Проверяем разрешение
  if (!representative.permissions.can_view_schedule) {
    await sendMessage(chatId, '🚫 *Нет доступа*\n\nУ вас нет разрешения на просмотр расписания. Обратитесь к администратору учебного центра.');
    
    // Логируем отказ
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/schedule',
      status: 'denied',
      errorMessage: 'Нет разрешения can_view_schedule',
      responseTimeMs: Date.now() - startTime,
    });
    
    return;
  }

  try {
    // Получаем расписание для организации
    const schedule = await getScheduleForRepresentative(representative);
    const message = formatSchedule(schedule);
    await sendMessage(chatId, message);
    await updateLastActivity(representative.id);
    
    // Логируем успешный запрос
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/schedule',
      status: 'success',
      requestData: { eventsCount: schedule.length },
      responseTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения расписания:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    
    // Логируем ошибку
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/schedule',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    });
  }
}

/**
 * Команда /certificates - сертификаты слушателей
 * Показывает кнопки фильтра по периоду перед выводом сертификатов
 */
async function commandCertificates(chatId: string): Promise<void> {
  const startTime = Date.now();
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  // Проверяем разрешение
  if (!representative.permissions.can_view_certificates) {
    await sendMessage(chatId, '🚫 *Нет доступа*\n\nУ вас нет разрешения на просмотр сертификатов. Обратитесь к администратору учебного центра.');
    
    // Логируем отказ
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/certificates',
      status: 'denied',
      errorMessage: 'Нет разрешения can_view_certificates',
      responseTimeMs: Date.now() - startTime,
    });
    
    return;
  }

  try {
    // Получаем все сертификаты для определения доступных периодов
    const certificates = await getCertificatesForRepresentative(representative);
    
    if (certificates.length === 0) {
      await sendMessage(chatId, BOT_MESSAGES.NO_CERTIFICATES);
      return;
    }
    
    // Группируем по периодам (мм.гггг)
    const periods = new Set<string>();
    for (const cert of certificates) {
      if (cert.issueDate) {
        // issueDate уже в формате dd.mm.yyyy
        const parts = cert.issueDate.split('.');
        if (parts.length === 3) {
          const month = parts[1];
          const year = parts[2];
          periods.add(`${month}.${year}`);
        }
      }
    }
    
    // Сортируем периоды по убыванию (новые первые)
    const sortedPeriods = Array.from(periods).sort((a, b) => {
      const [aMonth, aYear] = a.split('.').map(Number);
      const [bMonth, bYear] = b.split('.').map(Number);
      if (aYear !== bYear) return bYear! - aYear!;
      return bMonth! - aMonth!;
    });
    
    // Создаём клавиатуру с периодами
    const { InlineKeyboard } = await import('grammy');
    const keyboard = new InlineKeyboard();
    
    // Кнопка "Все сертификаты"
    keyboard.text('📋 Все сертификаты', 'certs_period_all');
    keyboard.row();
    
    // Добавляем кнопки периодов (максимум 6)
    let buttonsInRow = 0;
    for (const period of sortedPeriods.slice(0, 6)) {
      keyboard.text(`📅 ${period}`, `certs_period_${period}`);
      buttonsInRow++;
      if (buttonsInRow >= 3) {
        keyboard.row();
        buttonsInRow = 0;
      }
    }
    
    await sendMessage(chatId, '📜 *Сертификаты слушателей*\n\nВыберите период для просмотра сертификатов:', { replyMarkup: keyboard });
    
    await updateLastActivity(representative.id);
    
    // Логируем успешный запрос
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/certificates',
      status: 'success',
      requestData: { certificatesCount: certificates.length, periodsCount: sortedPeriods.length },
      responseTimeMs: Date.now() - startTime,
    });
    
    console.log(`[TelegramBot] Сертификаты: показаны периоды (${sortedPeriods.length}) для chatId: ${chatId}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения сертификатов:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    
    // Логируем ошибку
    const { logBotRequest } = await import('../utils/botLogger');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: '/certificates',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    });
  }
}


/**
 * Команда /help - справка
 */
async function commandHelp(chatId: string): Promise<void> {
  await sendMessage(chatId, BOT_MESSAGES.HELP);
}

// ============================================================================
// FSM - ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ
// ============================================================================

/**
 * Обработать текстовое сообщение в зависимости от состояния FSM
 */
async function handleTextMessage(chatId: string, text: string, username: string | null): Promise<void> {
  const session = await getOrCreateSession(chatId);
  
  switch (session.state) {
    case 'awaiting_name':
      await handleNameInput(chatId, text, session.data);
      break;
    case 'awaiting_phone':
      await handlePhoneInput(chatId, text, session.data);
      break;
    case 'awaiting_organization':
      await handleOrganizationInput(chatId, text, session.data);
      break;
    case 'pending_approval':
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
      break;
    case 'completed':
    case 'idle':
    default:
      // Для зарегистрированных пользователей показываем справку
      await sendMessage(chatId, BOT_MESSAGES.HELP);
  }
}

/**
 * Обработка ввода ФИО
 */
async function handleNameInput(chatId: string, name: string, sessionData: Record<string, any>): Promise<void> {
  if (!validateName(name)) {
    await sendMessage(chatId, BOT_MESSAGES.INVALID_NAME);
    return;
  }

  // Сохраняем ФИО и переходим к следующему шагу
  await updateSession(chatId, {
    state: 'awaiting_phone',
    data: { ...sessionData, fullName: name.trim() },
  });

  // Отправляем сообщение с кнопкой "Отправить контакт"
  await sendMessageWithContactButton(chatId, BOT_MESSAGES.ASK_PHONE);
  
  console.log(`[TelegramBot] chatId ${chatId}: ФИО сохранено - ${name}`);
}

/**
 * Обработка ввода телефона
 */
async function handlePhoneInput(chatId: string, phone: string, sessionData: Record<string, any>): Promise<void> {
  const normalized = normalizePhone(phone);
  
  if (!validatePhone(normalized)) {
    await sendMessage(chatId, BOT_MESSAGES.INVALID_PHONE);
    return;
  }

  // Сохраняем телефон и переходим к выбору организации
  await updateSession(chatId, {
    state: 'awaiting_organization',
    data: { ...sessionData, phone: normalized },
  });

  // Получаем список организаций для выбора
  const organizations = await getAllOrganizations();
  
  if (organizations.length > 0) {
    // Показываем кнопки с организациями (максимум 10)
    const topOrganizations = organizations.slice(0, 10).map(org => ({
      id: org.id,
      name: org.name.length > 30 ? org.name.substring(0, 27) + '...' : org.name,
    }));
    
    const keyboard = createOrganizationsKeyboard(topOrganizations);
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION, { replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION);
  }
  
  console.log(`[TelegramBot] chatId ${chatId}: телефон сохранён - ${normalized}`);
}

/**
 * Обработка контакта (кнопка отправки номера)
 */
async function handleContactMessage(chatId: string, phoneNumber: string, username: string | null): Promise<void> {
  const session = await getOrCreateSession(chatId);
  
  if (session.state !== 'awaiting_phone') {
    return;
  }

  const normalized = normalizePhone(phoneNumber);
  await handlePhoneInput(chatId, normalized, session.data);
}

/**
 * Обработка ввода/выбора организации
 */
async function handleOrganizationInput(chatId: string, organizationName: string, sessionData: Record<string, any>): Promise<void> {
  try {
    // Получаем или создаём организацию
    const organization = await getOrCreateOrganizationByName(organizationName);
    
    // Создаём заявку представителя
    await createRepresentativeFromSession(chatId, sessionData, organization.id);
    
    console.log(`[TelegramBot] chatId ${chatId}: организация выбрана - ${organization.name}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка создания представителя:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

// ============================================================================
// CALLBACK QUERY - INLINE КНОПКИ
// ============================================================================

/**
 * Обработать нажатие inline кнопки
 */
async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  const chatId = String(query.from.id);
  const data = query.data || '';

  console.log(`[TelegramBot] Callback от ${chatId}: ${data}`);

  // Отвечаем на callback (убираем loading)
  const bot = getBot();
  if (bot) {
    await bot.api.answerCallbackQuery(query.id);
  }

  // Обработка выбора организации
  if (data.startsWith('org_')) {
    const organizationId = data.substring(4);
    await handleOrganizationSelection(chatId, organizationId);
    return;
  }

  // Обработка запроса всех сертификатов
  if (data === 'get_all_certs') {
    await handleSendAllCertificates(chatId);
    return;
  }

  // Обработка запроса конкретного сертификата
  if (data.startsWith('get_cert_')) {
    const certificateId = data.substring(9);
    await handleSendCertificate(chatId, certificateId);
    return;
  }

  // Обработка выбора периода сертификатов
  if (data.startsWith('certs_period_')) {
    const period = data.substring(13);
    await handleCertificatesPeriodSelection(chatId, period);
    return;
  }

  // Обработка выбора курса для списка слушателей (короткий формат stc_)
  if (data.startsWith('stc_')) {
    const courseIndex = data.substring(4);
    await handleStudentsCourseSelection(chatId, courseIndex);
    return;
  }

  // Обработка выбора периода для списка слушателей (короткий формат stp_)
  if (data.startsWith('stp_')) {
    const parts = data.substring(4).split('_');
    const courseIndex = parts[0];
    const period = parts.slice(1).join('_');
    await handleStudentsPeriodSelection(chatId, courseIndex!, period);
    return;
  }

  // Обработка кнопки "назад" для сертификатов
  if (data === 'certs_back') {
    await commandCertificates(chatId);
    return;
  }

  // Обработка кнопки "назад" для слушателей
  if (data === 'stb') {
    await commandStudents(chatId);
    return;
  }
}

/**
 * Обработка выбора организации из кнопок
 */
async function handleOrganizationSelection(chatId: string, organizationId: string): Promise<void> {
  const session = await getOrCreateSession(chatId);
  
  if (session.state !== 'awaiting_organization') {
    return;
  }

  try {
    const organization = await getOrganizationById(organizationId);
    
    if (!organization) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }

    // Создаём заявку представителя
    await createRepresentativeFromSession(chatId, session.data, organization.id);
    
    console.log(`[TelegramBot] chatId ${chatId}: организация выбрана по ID - ${organization.name}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка при выборе организации:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Отправить все сертификаты организации
 */
async function handleSendAllCertificates(chatId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  // Проверяем разрешение
  if (!representative.permissions.can_request_certificates) {
    await sendMessage(chatId, '🚫 *Нет доступа*\n\nУ вас нет разрешения на запрос файлов сертификатов. Обратитесь к администратору учебного центра.');
    return;
  }

  try {
    await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_REQUEST_RECEIVED);
    
    const certificates = await getCertificatesForRepresentative(representative);
    const issuedCerts = certificates.filter(c => c.status === 'issued' && c.pdfFileUrl);
    
    if (issuedCerts.length === 0) {
      await sendMessage(chatId, BOT_MESSAGES.NO_CERTIFICATES);
      return;
    }

    // Ограничиваем количество за раз
    const certsToSend = issuedCerts.slice(0, 10);
    let sentCount = 0;

    const bot = getBot();
    if (!bot) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }

    for (const cert of certsToSend) {
      try {
        if (cert.pdfFileUrl) {
          // Отправляем файл
          const fs = await import('fs');
          const path = await import('path');
          
          // Формируем путь к файлу
          // URL хранится как /storage/certificates/generated/xxx.pdf
          // Нужно преобразовать в локальный путь
          let filePath: string;
          if (cert.pdfFileUrl.startsWith('/storage/')) {
            // URL начинается с /storage/ — используем корень проекта + путь без начального /
            filePath = path.join(process.cwd(), cert.pdfFileUrl.substring(1));
          } else if (cert.pdfFileUrl.startsWith('/')) {
            // Другой абсолютный путь — пробуем в public
            filePath = path.join(process.cwd(), 'public', cert.pdfFileUrl);
          } else {
            // Относительный путь
            filePath = path.join(process.cwd(), cert.pdfFileUrl);
          }
          
          if (!fs.existsSync(filePath)) {
            console.error(`[TelegramBot] Файл не найден: ${filePath}`);
            await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.studentName));
            continue;
          }

          // Отправляем документ
          await bot.api.sendDocument(chatId, new (await import('grammy')).InputFile(filePath), {
            caption: `📜 *Сертификат*\n${cert.studentName}\n№ ${cert.certificateNumber}\n${cert.courseName}`,
            parse_mode: 'Markdown',
          });
          
          // Отмечаем отправку в БД
          await markCertificateAsSent(cert.id);
          sentCount++;
        }
      } catch (error) {
        console.error(`[TelegramBot] Ошибка отправки сертификата ${cert.id}:`, error);
        await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.studentName));
      }
    }

    if (sentCount > 0) {
      await sendMessage(chatId, `✅ Отправлено ${sentCount} сертификатов`);
      
      if (issuedCerts.length > 10) {
        await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SENDING_LIMIT);
      }
    }

    await updateLastActivity(representative.id);
    console.log(`[TelegramBot] Отправлено ${sentCount} сертификатов для chatId: ${chatId}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка отправки сертификатов:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Отправить конкретный сертификат
 */
async function handleSendCertificate(chatId: string, certificateId: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  // Проверяем разрешение
  if (!representative.permissions.can_request_certificates) {
    await sendMessage(chatId, '🚫 *Нет доступа*\n\nУ вас нет разрешения на запрос файлов сертификатов.');
    return;
  }

  try {
    const { executeQuery } = await import('../utils/db');
    const { getOrganizationById } = await import('../repositories/organizationRepository');
    
    const organization = await getOrganizationById(representative.organizationId);
    if (!organization) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }

    // Получаем сертификат и проверяем что он принадлежит организации представителя
    const certs = await executeQuery<any[]>(`
      SELECT ic.*, s.full_name as student_name, s.organization, c.name as course_name
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      JOIN study_groups g ON ic.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      WHERE ic.id = ? AND s.organization = ?
    `, [certificateId, organization.name]);

    if (certs.length === 0) {
      await sendMessage(chatId, '❌ Сертификат не найден или не принадлежит вашей организации');
      return;
    }

    const cert = certs[0];

    if (!cert.pdf_file_url) {
      await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.student_name));
      return;
    }

    const bot = getBot();
    if (!bot) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }

    const fs = await import('fs');
    const path = await import('path');
    
    // Формируем путь к файлу
    // URL хранится как /storage/certificates/generated/xxx.pdf
    let filePath: string;
    if (cert.pdf_file_url.startsWith('/storage/')) {
      filePath = path.join(process.cwd(), cert.pdf_file_url.substring(1));
    } else if (cert.pdf_file_url.startsWith('/')) {
      filePath = path.join(process.cwd(), 'public', cert.pdf_file_url);
    } else {
      filePath = path.join(process.cwd(), cert.pdf_file_url);
    }
    
    if (!fs.existsSync(filePath)) {
      console.error(`[TelegramBot] Файл не найден: ${filePath}`);
      await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.student_name));
      return;
    }

    // Отправляем документ
    await bot.api.sendDocument(chatId, new (await import('grammy')).InputFile(filePath), {
      caption: `📜 *Сертификат*\n${cert.student_name}\n№ ${cert.certificate_number}\n${cert.course_name}`,
      parse_mode: 'Markdown',
    });

    // Отмечаем отправку в БД
    await markCertificateAsSent(certificateId);
    
    await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SENT(cert.student_name, cert.certificate_number));
    await updateLastActivity(representative.id);
    
    console.log(`[TelegramBot] Сертификат ${certificateId} отправлен для chatId: ${chatId}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка отправки сертификата:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Отметить сертификат как отправленный через Telegram
 */
async function markCertificateAsSent(certificateId: string): Promise<void> {
  try {
    const { executeQuery } = await import('../utils/db');
    await executeQuery(
      'UPDATE issued_certificates SET is_sent_via_telegram = 1, sent_at = ? WHERE id = ?',
      [new Date(), certificateId]
    );
  } catch (error) {
    console.error('[TelegramBot] Ошибка обновления статуса отправки:', error);
  }
}

/**
 * Обработка выбора периода для сертификатов
 */
async function handleCertificatesPeriodSelection(chatId: string, period: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  try {
    // Получаем сертификаты для организации
    let certificates = await getCertificatesForRepresentative(representative);
    
    // Фильтруем по периоду если указан
    if (period !== 'all') {
      const [monthStr, yearStr] = period.split('.');
      
      certificates = certificates.filter(cert => {
        if (!cert.issueDate) return false;
        // issueDate уже в формате dd.mm.yyyy
        const parts = cert.issueDate.split('.');
        if (parts.length !== 3) return false;
        const certMonth = parts[1];
        const certYear = parts[2];
        return certMonth === monthStr && certYear === yearStr;
      });
    }
    
    const message = formatCertificatesList(certificates);
    
    // Если есть сертификаты и есть разрешение на запрос файлов, добавляем кнопки
    if (certificates.length > 0 && representative.permissions.can_request_certificates) {
      const { InlineKeyboard } = await import('grammy');
      const keyboard = new InlineKeyboard();
      
      // Добавляем кнопку "Получить все сертификаты"
      keyboard.text('📥 Получить все сертификаты', 'get_all_certs');
      
      // Добавляем кнопки для отдельных сертификатов (максимум 5)
      const issuedCerts = certificates.filter(c => c.status === 'issued' && c.pdfFileUrl);
      for (const cert of issuedCerts.slice(0, 5)) {
        keyboard.row();
        keyboard.text(`📜 ${cert.certificateNumber}`, `get_cert_${cert.id}`);
      }
      
      // Кнопка назад
      keyboard.row();
      keyboard.text('◀️ Назад к выбору периода', 'certs_back');
      
      await sendMessage(chatId, message, { replyMarkup: keyboard });
    } else {
      await sendMessage(chatId, message);
    }
    
    await updateLastActivity(representative.id);
    console.log(`[TelegramBot] Показаны сертификаты за период ${period} для chatId: ${chatId}, найдено: ${certificates.length}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения сертификатов:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Обработка выбора курса для списка слушателей
 */
async function handleStudentsCourseSelection(chatId: string, courseIndex: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  try {
    // Получаем студентов для курса и группируем по периодам
    const students = await getStudentsForRepresentative(representative);
    
    // Получаем название курса из сессии по индексу
    let courseName: string | null = null;
    if (courseIndex !== 'all') {
      const session = await getOrCreateSession(chatId);
      const coursesList = session.data?.coursesList as string[] | undefined;
      const idx = parseInt(courseIndex, 10);
      if (coursesList && !isNaN(idx) && idx >= 0 && idx < coursesList.length) {
        courseName = coursesList[idx]!;
      }
    }
    
    // Фильтруем по курсу
    let filteredStudents = students;
    if (courseName) {
      filteredStudents = students.filter(s => s.courseName === courseName);
    }
    
    if (filteredStudents.length === 0) {
      await sendMessage(chatId, '📋 Слушатели не найдены для выбранного курса.');
      return;
    }
    
    // Извлекаем доступные периоды
    const periods = new Set<string>();
    for (const student of filteredStudents) {
      if (student.startDate) {
        // startDate уже в формате dd.mm.yyyy
        const parts = student.startDate.split('.');
        if (parts.length === 3) {
          const month = parts[1];
          const year = parts[2];
          periods.add(`${month}.${year}`);
        }
      }
    }
    
    // Сортируем периоды
    const sortedPeriods = Array.from(periods).sort((a, b) => {
      const [aMonth, aYear] = a.split('.').map(Number);
      const [bMonth, bYear] = b.split('.').map(Number);
      if (aYear !== bYear) return bYear! - aYear!;
      return bMonth! - aMonth!;
    });
    
    // Создаём клавиатуру с периодами (используем короткие callback_data)
    const { InlineKeyboard } = await import('grammy');
    const keyboard = new InlineKeyboard();
    
    // Кнопка "Все" (stp_ = students period)
    keyboard.text('📋 Все', `stp_${courseIndex}_all`);
    keyboard.row();
    
    // Добавляем кнопки периодов (максимум 6)
    let buttonsInRow = 0;
    for (const period of sortedPeriods.slice(0, 6)) {
      keyboard.text(`📅 ${period}`, `stp_${courseIndex}_${period}`);
      buttonsInRow++;
      if (buttonsInRow >= 3) {
        keyboard.row();
        buttonsInRow = 0;
      }
    }
    
    // Кнопка назад (stb = students back)
    keyboard.row();
    keyboard.text('◀️ Назад к выбору курса', 'stb');
    
    await sendMessage(chatId, '📅 Выберите период:', { replyMarkup: keyboard });
    await updateLastActivity(representative.id);
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения слушателей:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}

/**
 * Обработка выбора периода для списка слушателей
 */
async function handleStudentsPeriodSelection(chatId: string, courseIndex: string, period: string): Promise<void> {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  
  if (!representative || representative.status !== 'approved') {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }

  try {
    let students = await getStudentsForRepresentative(representative);
    
    // Получаем название курса из сессии по индексу
    let courseName: string | null = null;
    if (courseIndex !== 'all') {
      const session = await getOrCreateSession(chatId);
      const coursesList = session.data?.coursesList as string[] | undefined;
      const idx = parseInt(courseIndex, 10);
      if (coursesList && !isNaN(idx) && idx >= 0 && idx < coursesList.length) {
        courseName = coursesList[idx]!;
      }
    }
    
    // Фильтруем по курсу
    if (courseName) {
      students = students.filter(s => s.courseName === courseName);
    }
    
    // Фильтруем по периоду
    if (period !== 'all') {
      const [monthStr, yearStr] = period.split('.');
      
      students = students.filter(student => {
        if (!student.startDate) return false;
        // startDate уже в формате dd.mm.yyyy
        const parts = student.startDate.split('.');
        if (parts.length !== 3) return false;
        const studentMonth = parts[1];
        const studentYear = parts[2];
        return studentMonth === monthStr && studentYear === yearStr;
      });
    }
    
    const message = formatStudentsList(students);
    await sendMessage(chatId, message);
    await updateLastActivity(representative.id);
    
    console.log(`[TelegramBot] Показаны слушатели: курс=${courseName || 'all'}, период=${period}, найдено: ${students.length}`);
  } catch (error) {
    console.error('[TelegramBot] Ошибка получения слушателей:', error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}


/**
 * Создать представителя из данных сессии
 */
async function createRepresentativeFromSession(
  chatId: string,
  sessionData: Record<string, any>,
  organizationId: string
): Promise<void> {
  try {
    // Проверяем, не зарегистрирован ли уже этот chat_id
    const existing = await getRepresentativeByTelegramChatId(chatId);
    if (existing) {
      // Уже зарегистрирован - показываем статус
      await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
      await updateSession(chatId, { state: 'completed', data: {} });
      return;
    }

    // Создаём заявку
    const representative = await createRepresentative({
      organizationId,
      fullName: sessionData.fullName,
      phone: sessionData.phone,
      telegramChatId: chatId,
      telegramUsername: sessionData.username || undefined,
    });

    // Обновляем сессию
    await updateSession(chatId, {
      state: 'pending_approval',
      data: { ...sessionData, representativeId: representative.id },
    });

    // Отправляем подтверждение
    await sendMessage(chatId, BOT_MESSAGES.REGISTRATION_COMPLETE);

    // Логируем действие (без userId, т.к. это действие через бота)
    console.log(`[TelegramBot] Регистрация представителя: ${representative.id}, ФИО: ${representative.fullName}, Организация: ${organizationId}`);

    console.log(`[TelegramBot] Создана заявка представителя: ${representative.id}`);

    // TODO: Отправить уведомление администраторам
    
  } catch (error: any) {
    // Обработка ошибки дубликата
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
      await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
      await updateSession(chatId, { state: 'completed', data: {} });
      return;
    }
    
    console.error('[TelegramBot] Ошибка создания представителя:', error);
    throw error;
  }
}

// ============================================================================
// ПОЛУЧЕНИЕ ДАННЫХ ДЛЯ ПРЕДСТАВИТЕЛЯ
// ============================================================================

/**
 * Получить студентов организации для представителя
 */
async function getStudentsForRepresentative(representative: Representative): Promise<FormattedStudent[]> {
  // Импортируем executeQuery напрямую для сложного запроса
  const { executeQuery } = await import('../utils/db');
  
  // Сначала получаем название организации по organization_id
  const { getOrganizationById } = await import('../repositories/organizationRepository');
  const organization = await getOrganizationById(representative.organizationId);
  
  if (!organization) {
    return [];
  }

  // Получаем студентов с информацией о группах и курсах
  // students.organization - текстовое поле с названием организации
  // study_groups.code - код группы (например АПАК-20)
  const query = `
    SELECT 
      s.full_name,
      g.code as group_name,
      c.name as course_name,
      g.start_date,
      g.end_date
    FROM students s
    JOIN study_group_students gs ON s.id = gs.student_id
    JOIN study_groups g ON gs.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE s.organization = ?
      AND g.is_active = true
    ORDER BY g.start_date DESC, s.full_name ASC
  `;

  const rows = await executeQuery<any[]>(query, [organization.name]);

  return rows.map(row => ({
    fullName: row.full_name,
    groupName: row.group_name,
    courseName: row.course_name,
    startDate: formatDateShort(row.start_date),
    endDate: formatDateShort(row.end_date),
  }));
}

/**
 * Получить расписание для организации
 */
async function getScheduleForRepresentative(representative: Representative): Promise<FormattedScheduleEvent[]> {
  const { executeQuery } = await import('../utils/db');
  
  // Получаем название организации
  const { getOrganizationById } = await import('../repositories/organizationRepository');
  const organization = await getOrganizationById(representative.organizationId);
  
  if (!organization) {
    return [];
  }

  // Получаем ближайшие занятия (на неделю вперёд)
  const today = new Date();
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);

  // schedule_events использует start_time/end_time как DATETIME
  const query = `
    SELECT 
      se.start_time,
      se.end_time,
      se.event_type,
      se.title,
      d.name as discipline_name,
      i.full_name as instructor_name,
      c.name as classroom_name,
      g.code as group_name
    FROM schedule_events se
    JOIN study_groups g ON se.group_id = g.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms c ON se.classroom_id = c.id
    WHERE g.id IN (
      SELECT DISTINCT gs.group_id 
      FROM study_group_students gs
      JOIN students s ON gs.student_id = s.id
      WHERE s.organization = ?
    )
    AND DATE(se.start_time) BETWEEN ? AND ?
    ORDER BY se.start_time ASC
  `;

  const rows = await executeQuery<any[]>(query, [
    organization.name,
    today.toISOString().split('T')[0],
    weekLater.toISOString().split('T')[0],
  ]);

  return rows.map(row => {
    const startDate = new Date(row.start_time);
    const endDate = new Date(row.end_time);
    
    return {
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().substring(0, 5),
      endTime: endDate.toTimeString().substring(0, 5),
      eventType: row.event_type || 'lesson',
      disciplineName: row.discipline_name || row.title || 'Занятие',
      instructorName: row.instructor_name || 'Не назначен',
      location: row.classroom_name || undefined,
      groupName: row.group_name,
    };
  });
}

/**
 * Получить сертификаты слушателей организации
 */
async function getCertificatesForRepresentative(representative: Representative): Promise<FormattedCertificate[]> {
  const { executeQuery } = await import('../utils/db');
  
  // Получаем название организации
  const { getOrganizationById } = await import('../repositories/organizationRepository');
  const organization = await getOrganizationById(representative.organizationId);
  
  if (!organization) {
    return [];
  }

  // Получаем сертификаты слушателей организации с информацией о посещаемости
  const query = `
    SELECT 
      ic.id,
      ic.certificate_number,
      ic.issue_date,
      ic.status,
      ic.pdf_file_url,
      ic.warnings,
      ic.override_warnings,
      s.full_name as student_name,
      c.name as course_name,
      g.code as group_code,
      (
        SELECT ROUND(
          COALESCE(SUM(a.hours_attended), 0) * 100.0 / 
          NULLIF((SELECT SUM(d2.hours) FROM disciplines d2 WHERE d2.course_id = c.id), 0),
          1
        )
        FROM attendance a
        JOIN schedule_events se ON a.schedule_event_id = se.id
        WHERE a.student_id = s.id AND se.group_id = g.id
      ) as attendance_percent
    FROM issued_certificates ic
    JOIN students s ON ic.student_id = s.id
    JOIN study_groups g ON ic.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE s.organization = ?
    ORDER BY ic.issue_date DESC, s.full_name ASC
  `;

  const rows = await executeQuery<any[]>(query, [organization.name]);

  return rows.map(row => {
    // Определяем, прошёл ли слушатель обучение
    // Считаем "прошёл", если нет предупреждений или предупреждения были переопределены
    let warnings: any[] = [];
    try {
      warnings = row.warnings ? JSON.parse(row.warnings) : [];
    } catch (e) {
      console.warn('[TelegramBot] Не удалось распарсить warnings для сертификата:', row.id, e);
      warnings = [];
    }
    const hasPassed = warnings.length === 0 || row.override_warnings;
    
    return {
      id: row.id,
      studentName: row.student_name,
      certificateNumber: row.certificate_number,
      courseName: row.course_name,
      groupCode: row.group_code,
      issueDate: formatDateShort(row.issue_date),
      status: row.status,
      pdfFileUrl: row.pdf_file_url,
      hasPassed,
      attendancePercent: row.attendance_percent,
    };
  });
}

/**
 * Форматирование даты в короткий формат
 */
function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Форматирование времени
 */
function formatTimeShort(time: string | Date): string {
  if (time instanceof Date) {
    return time.toTimeString().substring(0, 5);
  }
  return String(time).substring(0, 5);
}

// ============================================================================
// УВЕДОМЛЕНИЯ
// ============================================================================

/**
 * Отправить уведомление об одобрении
 */
export async function notifyRepresentativeApproved(telegramChatId: string): Promise<boolean> {
  return sendMessage(telegramChatId, BOT_MESSAGES.NOTIFICATION_APPROVED);
}

/**
 * Отправить уведомление о блокировке
 */
export async function notifyRepresentativeBlocked(telegramChatId: string, reason: string): Promise<boolean> {
  return sendMessage(telegramChatId, BOT_MESSAGES.NOTIFICATION_BLOCKED(reason));
}

/**
 * Отправить произвольное уведомление представителю
 */
export async function sendNotificationToRepresentative(
  telegramChatId: string,
  message: string
): Promise<boolean> {
  return sendMessage(telegramChatId, message);
}
