/**
 * API endpoint для добавления сертификата студенту
 * POST /api/students/:id/certificates
 * 
 * @deprecated Этот эндпоинт устарел. 
 * Сертификаты теперь выдаются только через систему групп:
 * POST /api/certificates/issue/[groupId]
 * 
 * Для ручного добавления сертификата используйте интерфейс 
 * выдачи сертификатов в группе (/groups/[id]/certificates)
 */

export default defineEventHandler(async (event) => {
  console.warn('[DEPRECATED] POST /api/students/:id/certificates is deprecated. Use POST /api/certificates/issue/[groupId] instead.');
  
  throw createError({
    statusCode: 410, // Gone
    message: 'Этот эндпоинт устарел. Сертификаты теперь выдаются только через систему групп. Используйте страницу выдачи сертификатов в группе.',
  });
});
