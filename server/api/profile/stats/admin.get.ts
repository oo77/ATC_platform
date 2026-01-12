/**
 * API endpoint для получения статистики администратора
 * GET /api/profile/stats/admin
 */

import { defineEventHandler } from 'h3'
import { requireAllPermissions } from '../../../utils/permissions'
import { Permission } from '../../../types/permissions'
import { UserRole } from '../../../types/auth'
import { executeQuery } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  // Проверяем права доступа - только администратор
  const context = await requireAllPermissions(event, [Permission.USERS_VIEW])

  if (context.role !== UserRole.ADMIN) {
    throw createError({
      statusCode: 403,
      message: 'Доступ запрещен. Только для администраторов.',
    })
  }

  try {
    // Получаем статистику параллельно
    const [
      usersCount,
      studentsCount,
      instructorsCount,
      activeGroupsCount,
      coursesCount,
      organizationsCount,
      certificatesCount,
      todayActivitiesCount,
    ] = await Promise.all([
      // Всего пользователей
      executeQuery<any[]>('SELECT COUNT(*) as count FROM users'),

      // Всего студентов
      executeQuery<any[]>('SELECT COUNT(*) as count FROM students'),

      // Всего инструкторов
      executeQuery<any[]>('SELECT COUNT(*) as count FROM instructors'),

      // Активных групп
      executeQuery<any[]>(`
        SELECT COUNT(*) as count 
        FROM study_groups 
        WHERE is_active = TRUE
      `),

      // Всего курсов
      executeQuery<any[]>('SELECT COUNT(*) as count FROM courses'),

      // Всего организаций
      executeQuery<any[]>('SELECT COUNT(*) as count FROM organizations'),

      // Всего выданных сертификатов (таблица может не существовать)
      executeQuery<any[]>('SELECT COUNT(*) as count FROM certificates').catch(() => [{ count: 0 }]),

      // Активность за сегодня
      executeQuery<any[]>(`
        SELECT COUNT(*) as count 
        FROM activity_logs 
        WHERE DATE(created_at) = CURDATE()
      `),
    ])

    // Получаем статистику по ролям пользователей
    const roleStats = await executeQuery<any[]>(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `)

    // Получаем статистику по статусам групп (активные/неактивные)
    const groupStats = await executeQuery<any[]>(`
      SELECT 
        CASE WHEN is_active = TRUE THEN 'ACTIVE' ELSE 'INACTIVE' END as status,
        COUNT(*) as count
      FROM study_groups
      GROUP BY is_active
    `)

    // Получаем последние зарегистрированные пользователи
    const recentUsers = await executeQuery<any[]>(`
      SELECT 
        id,
        name,
        email,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `)

    return {
      success: true,
      stats: {
        totalUsers: usersCount[0]?.count || 0,
        totalStudents: studentsCount[0]?.count || 0,
        totalInstructors: instructorsCount[0]?.count || 0,
        activeGroups: activeGroupsCount[0]?.count || 0,
        totalCourses: coursesCount[0]?.count || 0,
        totalOrganizations: organizationsCount[0]?.count || 0,
        totalCertificates: certificatesCount[0]?.count || 0,
        todayActivities: todayActivitiesCount[0]?.count || 0,
        roleDistribution: roleStats,
        groupStatusDistribution: groupStats,
        recentUsers: recentUsers,
      },
    }
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении статистики',
    })
  }
})
