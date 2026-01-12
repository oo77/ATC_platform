/**
 * API endpoint для перемещения слушателя в другую группу
 * POST /api/groups/[id]/students/transfer
 */

import { z } from 'zod';
import { 
  getGroupById,
  transferStudent,
  checkStudentConflicts 
} from '../../../../repositories/groupRepository';

const transferSchema = z.object({
  studentId: z.string().min(1, 'ID слушателя обязателен'),
  toGroupId: z.string().min(1, 'ID целевой группы обязателен'),
});

export default defineEventHandler(async (event) => {
  try {
    const fromGroupId = getRouterParam(event, 'id');
    
    if (!fromGroupId) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    const body = await readBody(event);
    
    // Валидация данных
    const validationResult = transferSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      
      return {
        success: false,
        message: 'Ошибка валидации данных',
        errors,
      };
    }

    const { studentId, toGroupId } = validationResult.data;

    // Проверяем существование исходной группы
    const fromGroup = await getGroupById(fromGroupId);
    if (!fromGroup) {
      return {
        success: false,
        message: 'Исходная группа не найдена',
      };
    }

    // Проверяем существование целевой группы
    const toGroup = await getGroupById(toGroupId);
    if (!toGroup) {
      return {
        success: false,
        message: 'Целевая группа не найдена',
      };
    }

    // Проверяем, что слушатель есть в исходной группе
    const studentInGroup = fromGroup.students?.find(s => s.studentId === studentId);
    if (!studentInGroup) {
      return {
        success: false,
        message: 'Слушатель не найден в исходной группе',
      };
    }

    // Проверяем конфликты с целевой группой
    const toStartDate = formatDateLocal(toGroup.startDate);
    const toEndDate = formatDateLocal(toGroup.endDate);

    const conflicts = await checkStudentConflicts(
      [studentId],
      toStartDate,
      toEndDate,
      fromGroupId // исключаем исходную группу (слушатель будет из неё удалён)
    );

    // Фильтруем конфликт с целевой группой (если слушатель уже там)
    const realConflicts = conflicts.filter(c => c.conflictGroupId !== toGroupId);

    if (realConflicts.length > 0) {
      return {
        success: false,
        message: 'Перемещение создаст конфликт с другой группой',
        conflicts: realConflicts,
      };
    }

    // Выполняем перемещение
    await transferStudent(studentId, fromGroupId, toGroupId);

    return {
      success: true,
      message: `Слушатель перемещён в группу ${toGroup.code}`,
    };
  } catch (error) {
    console.error('Ошибка перемещения слушателя:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при перемещении слушателя',
    };
  }
});

// Форматирует дату в YYYY-MM-DD без сдвига временной зоны
function formatDateLocal(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
