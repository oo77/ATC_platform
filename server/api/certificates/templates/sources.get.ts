/**
 * GET /api/certificates/templates/sources
 * Получить список доступных источников данных для переменных
 * 
 * Используется визуальным редактором для отображения списка переменных
 */

export default defineEventHandler(async () => {
  // Источники данных для переменных (синхронизированы с AVAILABLE_VARIABLES в composable)
  const sources = [
    // Данные студента
    { value: 'student.fullName', label: 'ФИО полностью', group: 'Студент' },
    { value: 'student.shortName', label: 'ФИО сокращённо (Иванов И.И.)', group: 'Студент' },
    { value: 'student.lastName', label: 'Фамилия', group: 'Студент' },
    { value: 'student.firstName', label: 'Имя', group: 'Студент' },
    { value: 'student.middleName', label: 'Отчество', group: 'Студент' },
    { value: 'student.organization', label: 'Организация', group: 'Студент' },
    { value: 'student.position', label: 'Должность', group: 'Студент' },
    { value: 'student.department', label: 'Отдел', group: 'Студент' },
    { value: 'student.pinfl', label: 'ПИНФЛ', group: 'Студент' },
    
    // Данные курса
    { value: 'course.name', label: 'Название курса', group: 'Курс' },
    { value: 'course.shortName', label: 'Краткое название', group: 'Курс' },
    { value: 'course.code', label: 'Код курса', group: 'Курс' },
    { value: 'course.totalHours', label: 'Всего часов', group: 'Курс' },
    { value: 'course.description', label: 'Описание курса', group: 'Курс' },
    
    // Данные группы
    { value: 'group.code', label: 'Код группы', group: 'Группа' },
    { value: 'group.startDate', label: 'Дата начала', group: 'Группа' },
    { value: 'group.endDate', label: 'Дата окончания', group: 'Группа' },
    { value: 'group.classroom', label: 'Аудитория', group: 'Группа' },
    
    // Данные сертификата
    { value: 'certificate.number', label: 'Номер сертификата', group: 'Сертификат' },
    { value: 'certificate.issueDate', label: 'Дата выдачи (ДД.ММ.ГГГГ)', group: 'Сертификат' },
    { value: 'certificate.issueDateFormatted', label: 'Дата выдачи прописью', group: 'Сертификат' },
  ];

  // Группируем по категориям
  const grouped = sources.reduce((acc: Record<string, { value: string; label: string }[]>, source) => {
    if (!acc[source.group]) {
      acc[source.group] = [];
    }
    acc[source.group].push({
      value: source.value,
      label: source.label,
    });
    return acc;
  }, {});

  return {
    success: true,
    sources,
    grouped,
  };
});
