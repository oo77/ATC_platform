import { d as defineEventHandler, U as UserRole, c as createError, e as executeQuery } from '../../../../nitro/nitro.mjs';
import { f as requireAllPermissions, P as Permission } from '../../../../_/permissions.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';

const admin_get = defineEventHandler(async (event) => {
  const context = await requireAllPermissions(event, [Permission.USERS_VIEW]);
  if (context.role !== UserRole.ADMIN) {
    throw createError({
      statusCode: 403,
      message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D. \u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u0432."
    });
  }
  try {
    const [
      usersCount,
      studentsCount,
      instructorsCount,
      activeGroupsCount,
      coursesCount,
      organizationsCount,
      certificatesCount,
      todayActivitiesCount
    ] = await Promise.all([
      // Всего пользователей
      executeQuery("SELECT COUNT(*) as count FROM users"),
      // Всего студентов
      executeQuery("SELECT COUNT(*) as count FROM students"),
      // Всего инструкторов
      executeQuery("SELECT COUNT(*) as count FROM instructors"),
      // Активных групп
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM study_groups 
        WHERE is_active = TRUE
      `),
      // Всего курсов
      executeQuery("SELECT COUNT(*) as count FROM courses"),
      // Всего организаций
      executeQuery("SELECT COUNT(*) as count FROM organizations"),
      // Всего выданных сертификатов (таблица может не существовать)
      executeQuery("SELECT COUNT(*) as count FROM certificates").catch(() => [{ count: 0 }]),
      // Активность за сегодня
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM activity_logs 
        WHERE DATE(created_at) = CURDATE()
      `)
    ]);
    const roleStats = await executeQuery(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    const groupStats = await executeQuery(`
      SELECT 
        CASE WHEN is_active = TRUE THEN 'ACTIVE' ELSE 'INACTIVE' END as status,
        COUNT(*) as count
      FROM study_groups
      GROUP BY is_active
    `);
    const recentUsers = await executeQuery(`
      SELECT 
        id,
        name,
        email,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
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
        recentUsers
      }
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438"
    });
  }
});

export { admin_get as default };
//# sourceMappingURL=admin.get.mjs.map
