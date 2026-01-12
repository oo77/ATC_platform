import { U as UserRole, c as createError, e as executeQuery, l as getHeader, n as verifyToken } from '../nitro/nitro.mjs';

var Permission = /* @__PURE__ */ ((Permission2) => {
  Permission2["DASHBOARD_VIEW"] = "dashboard:view";
  Permission2["DASHBOARD_STATS"] = "dashboard:stats";
  Permission2["USERS_VIEW"] = "users:view";
  Permission2["USERS_CREATE"] = "users:create";
  Permission2["USERS_UPDATE"] = "users:update";
  Permission2["USERS_DELETE"] = "users:delete";
  Permission2["USERS_MANAGE_ROLES"] = "users:manage_roles";
  Permission2["STUDENTS_VIEW"] = "students:view";
  Permission2["STUDENTS_VIEW_OWN"] = "students:view_own";
  Permission2["STUDENTS_VIEW_ALL"] = "students:view_all";
  Permission2["STUDENTS_CREATE"] = "students:create";
  Permission2["STUDENTS_UPDATE"] = "students:update";
  Permission2["STUDENTS_DELETE"] = "students:delete";
  Permission2["STUDENTS_IMPORT"] = "students:import";
  Permission2["STUDENTS_EXPORT"] = "students:export";
  Permission2["INSTRUCTORS_VIEW"] = "instructors:view";
  Permission2["INSTRUCTORS_CREATE"] = "instructors:create";
  Permission2["INSTRUCTORS_UPDATE"] = "instructors:update";
  Permission2["INSTRUCTORS_DELETE"] = "instructors:delete";
  Permission2["INSTRUCTORS_HOURS"] = "instructors:hours";
  Permission2["ORGANIZATIONS_VIEW"] = "organizations:view";
  Permission2["ORGANIZATIONS_CREATE"] = "organizations:create";
  Permission2["ORGANIZATIONS_UPDATE"] = "organizations:update";
  Permission2["ORGANIZATIONS_DELETE"] = "organizations:delete";
  Permission2["REPRESENTATIVES_VIEW"] = "representatives:view";
  Permission2["REPRESENTATIVES_APPROVE"] = "representatives:approve";
  Permission2["REPRESENTATIVES_BLOCK"] = "representatives:block";
  Permission2["REPRESENTATIVES_MANAGE"] = "representatives:manage";
  Permission2["COURSES_VIEW"] = "courses:view";
  Permission2["COURSES_CREATE"] = "courses:create";
  Permission2["COURSES_UPDATE"] = "courses:update";
  Permission2["COURSES_DELETE"] = "courses:delete";
  Permission2["DISCIPLINES_VIEW"] = "disciplines:view";
  Permission2["DISCIPLINES_MANAGE"] = "disciplines:manage";
  Permission2["GROUPS_VIEW"] = "groups:view";
  Permission2["GROUPS_VIEW_OWN"] = "groups:view_own";
  Permission2["GROUPS_VIEW_ALL"] = "groups:view_all";
  Permission2["GROUPS_CREATE"] = "groups:create";
  Permission2["GROUPS_UPDATE"] = "groups:update";
  Permission2["GROUPS_DELETE"] = "groups:delete";
  Permission2["GROUPS_MANAGE_STUDENTS"] = "groups:manage_students";
  Permission2["SCHEDULE_VIEW"] = "schedule:view";
  Permission2["SCHEDULE_VIEW_OWN"] = "schedule:view_own";
  Permission2["SCHEDULE_VIEW_ALL"] = "schedule:view_all";
  Permission2["SCHEDULE_CREATE"] = "schedule:create";
  Permission2["SCHEDULE_UPDATE"] = "schedule:update";
  Permission2["SCHEDULE_DELETE"] = "schedule:delete";
  Permission2["ATTENDANCE_VIEW"] = "attendance:view";
  Permission2["ATTENDANCE_MARK"] = "attendance:mark";
  Permission2["ATTENDANCE_EDIT"] = "attendance:edit";
  Permission2["GRADES_VIEW"] = "grades:view";
  Permission2["GRADES_MANAGE"] = "grades:manage";
  Permission2["CERTIFICATES_VIEW"] = "certificates:view";
  Permission2["CERTIFICATES_VIEW_OWN"] = "certificates:view_own";
  Permission2["CERTIFICATES_ISSUE"] = "certificates:issue";
  Permission2["CERTIFICATES_REVOKE"] = "certificates:revoke";
  Permission2["CERTIFICATES_DOWNLOAD"] = "certificates:download";
  Permission2["TEMPLATES_VIEW"] = "templates:view";
  Permission2["TEMPLATES_CREATE"] = "templates:create";
  Permission2["TEMPLATES_UPDATE"] = "templates:update";
  Permission2["TEMPLATES_DELETE"] = "templates:delete";
  Permission2["FILES_VIEW"] = "files:view";
  Permission2["FILES_UPLOAD"] = "files:upload";
  Permission2["FILES_DELETE"] = "files:delete";
  Permission2["FILES_MANAGE"] = "files:manage";
  Permission2["SETTINGS_VIEW"] = "settings:view";
  Permission2["SETTINGS_MANAGE"] = "settings:manage";
  Permission2["LOGS_VIEW"] = "logs:view";
  return Permission2;
})(Permission || {});
const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MANAGER]: [
    "dashboard:view" /* DASHBOARD_VIEW */,
    "dashboard:stats" /* DASHBOARD_STATS */,
    "users:view" /* USERS_VIEW */,
    "students:view" /* STUDENTS_VIEW */,
    "students:view_all" /* STUDENTS_VIEW_ALL */,
    "students:create" /* STUDENTS_CREATE */,
    "students:update" /* STUDENTS_UPDATE */,
    "students:import" /* STUDENTS_IMPORT */,
    "students:export" /* STUDENTS_EXPORT */,
    "instructors:view" /* INSTRUCTORS_VIEW */,
    "instructors:create" /* INSTRUCTORS_CREATE */,
    "instructors:update" /* INSTRUCTORS_UPDATE */,
    "instructors:hours" /* INSTRUCTORS_HOURS */,
    "organizations:view" /* ORGANIZATIONS_VIEW */,
    "organizations:create" /* ORGANIZATIONS_CREATE */,
    "organizations:update" /* ORGANIZATIONS_UPDATE */,
    "representatives:view" /* REPRESENTATIVES_VIEW */,
    "representatives:approve" /* REPRESENTATIVES_APPROVE */,
    "representatives:block" /* REPRESENTATIVES_BLOCK */,
    "courses:view" /* COURSES_VIEW */,
    "disciplines:view" /* DISCIPLINES_VIEW */,
    "groups:view" /* GROUPS_VIEW */,
    "groups:view_all" /* GROUPS_VIEW_ALL */,
    "groups:create" /* GROUPS_CREATE */,
    "groups:update" /* GROUPS_UPDATE */,
    "groups:manage_students" /* GROUPS_MANAGE_STUDENTS */,
    "schedule:view" /* SCHEDULE_VIEW */,
    "schedule:view_all" /* SCHEDULE_VIEW_ALL */,
    "schedule:create" /* SCHEDULE_CREATE */,
    "schedule:update" /* SCHEDULE_UPDATE */,
    "attendance:view" /* ATTENDANCE_VIEW */,
    "attendance:mark" /* ATTENDANCE_MARK */,
    "attendance:edit" /* ATTENDANCE_EDIT */,
    "grades:view" /* GRADES_VIEW */,
    "grades:manage" /* GRADES_MANAGE */,
    "certificates:view" /* CERTIFICATES_VIEW */,
    "certificates:issue" /* CERTIFICATES_ISSUE */,
    "certificates:download" /* CERTIFICATES_DOWNLOAD */,
    "templates:view" /* TEMPLATES_VIEW */,
    "files:view" /* FILES_VIEW */,
    "files:upload" /* FILES_UPLOAD */,
    "settings:view" /* SETTINGS_VIEW */,
    "logs:view" /* LOGS_VIEW */
  ],
  [UserRole.TEACHER]: [
    "dashboard:view" /* DASHBOARD_VIEW */,
    "students:view" /* STUDENTS_VIEW */,
    "students:view_own" /* STUDENTS_VIEW_OWN */,
    "groups:view" /* GROUPS_VIEW */,
    "groups:view_own" /* GROUPS_VIEW_OWN */,
    "schedule:view" /* SCHEDULE_VIEW */,
    "schedule:view_own" /* SCHEDULE_VIEW_OWN */,
    "attendance:view" /* ATTENDANCE_VIEW */,
    "attendance:mark" /* ATTENDANCE_MARK */,
    "grades:view" /* GRADES_VIEW */,
    "grades:manage" /* GRADES_MANAGE */,
    "files:view" /* FILES_VIEW */,
    "courses:view" /* COURSES_VIEW */,
    "disciplines:view" /* DISCIPLINES_VIEW */
  ],
  [UserRole.STUDENT]: [
    "dashboard:view" /* DASHBOARD_VIEW */,
    "students:view_own" /* STUDENTS_VIEW_OWN */,
    "schedule:view" /* SCHEDULE_VIEW */,
    "schedule:view_own" /* SCHEDULE_VIEW_OWN */,
    "attendance:view" /* ATTENDANCE_VIEW */,
    "grades:view" /* GRADES_VIEW */,
    "certificates:view" /* CERTIFICATES_VIEW */,
    "certificates:view_own" /* CERTIFICATES_VIEW_OWN */,
    "certificates:download" /* CERTIFICATES_DOWNLOAD */
  ]
};

function roleHasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}
function roleHasAllPermissions(role, permissions) {
  return permissions.every((p) => roleHasPermission(role, p));
}
function roleHasAnyPermission(role, permissions) {
  return permissions.some((p) => roleHasPermission(role, p));
}
function getAuthUserFromEvent(event) {
  if (event.context.user) {
    return {
      userId: event.context.user.id,
      email: event.context.user.email,
      role: event.context.user.role
    };
  }
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}
async function getPermissionContext(event) {
  const user = getAuthUserFromEvent(event);
  if (!user) return null;
  const context = {
    userId: user.userId,
    role: user.role
  };
  if (user.role === UserRole.TEACHER) {
    const instructor = await getInstructorByUserId(user.userId);
    if (instructor) {
      context.instructorId = instructor.id;
    }
  }
  if (user.role === UserRole.STUDENT) {
    const student = await getStudentByUserId(user.userId);
    if (student) {
      context.studentId = student.id;
    }
  }
  return context;
}
async function getInstructorByUserId(userId) {
  try {
    console.log(`[Permissions] getInstructorByUserId called with userId: ${userId}`);
    const rows = await executeQuery(
      "SELECT id, full_name as fullName FROM instructors WHERE user_id = ? LIMIT 1",
      [userId]
    );
    console.log(`[Permissions] Query result type:`, typeof rows);
    console.log(`[Permissions] Query result is array:`, Array.isArray(rows));
    console.log(`[Permissions] Query result:`, rows);
    console.log(`[Permissions] Query result length:`, rows?.length);
    if (rows && rows.length > 0) {
      console.log(`[Permissions] Found instructor: ${rows[0].fullName} (ID: ${rows[0].id})`);
      return rows[0];
    } else {
      console.log(`[Permissions] No instructor found for user_id: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error("[Permissions] Error getting instructor by user_id:", error);
    return null;
  }
}
async function getStudentByUserId(userId) {
  try {
    const rows = await executeQuery(
      "SELECT id, full_name as fullName FROM students WHERE user_id = ? LIMIT 1",
      [userId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("[Permissions] Error getting student by user_id:", error);
    return null;
  }
}
async function getTeacherGroups(instructorId) {
  try {
    const rows = await executeQuery(
      `SELECT DISTINCT group_id FROM (
        -- \u0413\u0440\u0443\u043F\u043F\u044B \u0438\u0437 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F
        SELECT group_id FROM schedule_events WHERE instructor_id = ? AND group_id IS NOT NULL
        UNION
        -- \u0413\u0440\u0443\u043F\u043F\u044B \u0447\u0435\u0440\u0435\u0437 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C
        SELECT sg.id as group_id
        FROM study_groups sg
        JOIN disciplines d ON d.course_id = sg.course_id
        JOIN discipline_instructors di ON di.discipline_id = d.id
        WHERE di.instructor_id = ?
      ) AS teacher_groups`,
      [instructorId, instructorId]
    );
    const groupIds = rows.map((r) => r.group_id).filter(Boolean);
    console.log(`[Permissions] getTeacherGroups for ${instructorId}: found ${groupIds.length} groups`);
    return groupIds;
  } catch (error) {
    console.error("[Permissions] Error getting teacher groups:", error);
    return [];
  }
}
async function getStudentGroups(studentId) {
  try {
    const rows = await executeQuery(
      "SELECT group_id FROM study_group_students WHERE student_id = ?",
      [studentId]
    );
    return rows.map((r) => r.group_id);
  } catch (error) {
    console.error("[Permissions] Error getting student groups:", error);
    return [];
  }
}
async function requireAuth(event) {
  const context = await getPermissionContext(event);
  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  return context;
}
async function requirePermission(event, permission) {
  const context = await getPermissionContext(event);
  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  if (!roleHasPermission(context.role, permission)) {
    console.warn(`[Permissions] Access denied: user ${context.userId} (${context.role}) lacks permission ${permission}`);
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F: ${permission}`
    });
  }
  return context;
}
async function requireAnyPermission(event, permissions) {
  const context = await getPermissionContext(event);
  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  if (!roleHasAnyPermission(context.role, permissions)) {
    console.warn(`[Permissions] Access denied: user ${context.userId} (${context.role}) lacks any of [${permissions.join(", ")}]`);
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043E\u0434\u043D\u043E \u0438\u0437: ${permissions.join(", ")}`
    });
  }
  return context;
}
async function requireAllPermissions(event, permissions) {
  const context = await getPermissionContext(event);
  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  if (!roleHasAllPermissions(context.role, permissions)) {
    const missing = permissions.filter((p) => !roleHasPermission(context.role, p));
    console.warn(`[Permissions] Access denied: user ${context.userId} (${context.role}) lacks permissions [${missing.join(", ")}]`);
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432. \u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442: ${missing.join(", ")}`
    });
  }
  return context;
}

export { Permission as P, requireAnyPermission as a, requirePermission as b, getPermissionContext as c, roleHasPermission as d, getTeacherGroups as e, requireAllPermissions as f, getStudentByUserId as g, getStudentGroups as h, requireAuth as r };
//# sourceMappingURL=permissions.mjs.map
