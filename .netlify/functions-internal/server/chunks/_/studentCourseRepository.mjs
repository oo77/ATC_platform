import { e as executeQuery } from './nitro.mjs';

async function getStudentIdByUserId(userId) {
  const rows = await executeQuery(
    "SELECT id FROM students WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows.length > 0 ? rows[0].id : null;
}
async function getStudentCourses(userId) {
  const studentId = await getStudentIdByUserId(userId);
  if (!studentId) {
    return [];
  }
  const query = `
    SELECT 
      sg.id as group_id, 
      c.id as course_id, 
      c.name as course_name, 
      sg.code as group_name,
      CASE 
        WHEN sg.end_date < NOW() THEN 'completed' 
        ELSE 'active' 
      END as status,
      sg.start_date,
      sg.end_date,
      (SELECT i.full_name FROM schedule_events se 
        JOIN instructors i ON se.instructor_id = i.id 
        WHERE se.group_id = sg.id LIMIT 1) as teacher_name,
      (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id) as total_lessons,
      COALESCE((
        SELECT COUNT(*) 
        FROM attendance a
        JOIN schedule_events se ON a.schedule_event_id = se.id
        WHERE a.student_id = ? AND se.group_id = sg.id AND a.hours_attended > 0
      ), 0) as attended_lessons
    FROM students s
    JOIN study_group_students sgs ON s.id = sgs.student_id
    JOIN study_groups sg ON sgs.group_id = sg.id
    JOIN courses c ON sg.course_id = c.id
    WHERE s.user_id = ?
    ORDER BY sg.start_date DESC
  `;
  const rows = await executeQuery(query, [studentId, userId]);
  return rows.map((row) => {
    let progress = 0;
    if (row.total_lessons > 0) {
      progress = Math.round(row.attended_lessons / row.total_lessons * 100);
    }
    return {
      group_id: row.group_id,
      course_id: row.course_id,
      course_name: row.course_name,
      group_name: row.group_name,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
      teacher_name: row.teacher_name || null,
      progress,
      total_lessons: row.total_lessons,
      attended_lessons: row.attended_lessons
    };
  });
}
async function getStudentCourseDetails(userId, groupId) {
  const studentId = await getStudentIdByUserId(userId);
  if (!studentId) return null;
  const courseQuery = `
    SELECT 
      sg.id as group_id, 
      c.id as course_id, 
      c.name as course_name, 
      sg.code as group_name,
      CASE 
        WHEN sg.end_date < NOW() THEN 'completed' 
        ELSE 'active' 
      END as status,
      sg.start_date,
      sg.end_date,
      (SELECT i.full_name FROM schedule_events se 
        JOIN instructors i ON se.instructor_id = i.id 
        WHERE se.group_id = sg.id LIMIT 1) as teacher_name,
      (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id) as total_lessons
    FROM students s
    JOIN study_group_students sgs ON s.id = sgs.student_id
    JOIN study_groups sg ON sgs.group_id = sg.id
    JOIN courses c ON sg.course_id = c.id
    WHERE s.user_id = ? AND sg.id = ?
    LIMIT 1
  `;
  const courseRows = await executeQuery(courseQuery, [userId, groupId]);
  if (courseRows.length === 0) return null;
  const courseRow = courseRows[0];
  const attendanceCountQuery = `
    SELECT COUNT(*) as count 
    FROM attendance a
    JOIN schedule_events se ON a.schedule_event_id = se.id
    WHERE a.student_id = ? AND se.group_id = ? AND a.hours_attended > 0
  `;
  const attRows = await executeQuery(attendanceCountQuery, [studentId, groupId]);
  const attendedCount = attRows[0]?.count || 0;
  let progress = 0;
  if (courseRow.total_lessons > 0) {
    progress = Math.round(attendedCount / courseRow.total_lessons * 100);
  }
  const courseInfo = {
    group_id: courseRow.group_id,
    course_id: courseRow.course_id,
    course_name: courseRow.course_name,
    group_name: courseRow.group_name,
    status: courseRow.status,
    start_date: courseRow.start_date,
    end_date: courseRow.end_date,
    teacher_name: courseRow.teacher_name || null,
    progress,
    total_lessons: courseRow.total_lessons,
    attended_lessons: attendedCount
  };
  const scheduleQuery = `
    SELECT 
      se.id,
      se.title,
      se.description,
      se.start_time,
      se.end_time,
      se.event_type,
      CASE 
        WHEN a.id IS NULL THEN NULL
        WHEN a.hours_attended >= a.max_hours THEN 'present'
        WHEN a.hours_attended > 0 THEN 'late'
        ELSE 'absent'
      END as attendance_status,
      g.grade as grade,
      100 as max_grade
    FROM schedule_events se
    LEFT JOIN attendance a ON se.id = a.schedule_event_id AND a.student_id = ?
    LEFT JOIN grades g ON se.id = g.schedule_event_id AND g.student_id = ?
    WHERE se.group_id = ?
    ORDER BY se.start_time ASC
  `;
  try {
    const scheduleRows = await executeQuery(scheduleQuery, [studentId, studentId, groupId]);
    const schedule = scheduleRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      start_time: row.start_time,
      end_time: row.end_time,
      event_type: row.event_type,
      attendance_status: row.attendance_status,
      grade: row.grade,
      max_grade: row.max_grade
    }));
    return {
      info: courseInfo,
      schedule
    };
  } catch (e) {
    console.warn("Failed to fetch grades/attendance with simple join, trying without grades:", e.message);
    const scheduleQuerySimple = `
        SELECT 
          se.id,
          se.title,
          se.description,
          se.start_time,
          se.end_time,
          se.event_type,
          CASE 
            WHEN a.id IS NULL THEN NULL
            WHEN a.hours_attended >= a.max_hours THEN 'present'
            WHEN a.hours_attended > 0 THEN 'late'
            ELSE 'absent'
          END as attendance_status
        FROM schedule_events se
        LEFT JOIN attendance a ON se.id = a.schedule_event_id AND a.student_id = ?
        WHERE se.group_id = ?
        ORDER BY se.start_time ASC
      `;
    const scheduleRows = await executeQuery(scheduleQuerySimple, [studentId, groupId]);
    const schedule = scheduleRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      start_time: row.start_time,
      end_time: row.end_time,
      event_type: row.event_type,
      attendance_status: row.attendance_status,
      grade: null,
      max_grade: null
    }));
    return {
      info: courseInfo,
      schedule
    };
  }
}
async function getStudentDashboardStats(userId) {
  const studentId = await getStudentIdByUserId(userId);
  if (!studentId) return null;
  const now = /* @__PURE__ */ new Date();
  const upcomingEventsQuery = `
    SELECT 
      se.id,
      se.title,
      se.start_time,
      se.end_time,
      se.event_type,
      c.name as course_name,
      cr.name as classroom_name
    FROM schedule_events se
    JOIN study_group_students sgs ON se.group_id = sgs.group_id
    JOIN study_groups sg ON se.group_id = sg.id
    JOIN courses c ON sg.course_id = c.id
    LEFT JOIN classrooms cr ON se.classroom_id = cr.id
    WHERE sgs.student_id = ? 
      AND se.end_time > ?
    ORDER BY se.start_time ASC
    LIMIT 3
  `;
  const upcomingEvents = await executeQuery(upcomingEventsQuery, [studentId, now]);
  const activeCoursesQuery = `
    SELECT 
      sg.id as group_id, 
      c.name as course_name, 
      sg.code as group_name,
      sg.end_date,
      (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id) as total_lessons,
      (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id AND se.end_time < ?) as passed_lessons
    FROM study_group_students sgs
    JOIN study_groups sg ON sgs.group_id = sg.id
    JOIN courses c ON sg.course_id = c.id
    WHERE sgs.student_id = ? AND sg.end_date >= NOW()
  `;
  const activeCourses = await executeQuery(activeCoursesQuery, [now, studentId]);
  const coursesWithProgress = activeCourses.map((course) => {
    let progress = 0;
    if (course.total_lessons > 0) {
      progress = Math.round(course.passed_lessons / course.total_lessons * 100);
    }
    return { ...course, progress };
  });
  let upcomingDeadlines = [];
  try {
    const deadlinesQuery = `
      SELECT 
        ta.id,
        tt.name as test_name,
        ta.end_date,
        c.name as course_name
      FROM test_assignments ta
      JOIN study_group_students sgs ON ta.group_id = sgs.group_id
      JOIN test_templates tt ON ta.test_template_id = tt.id
      JOIN study_groups sg ON ta.group_id = sg.id
      JOIN courses c ON sg.course_id = c.id
      LEFT JOIN test_sessions ts ON ta.id = ts.assignment_id AND ts.student_id = ?
      WHERE sgs.student_id = ?
        AND ta.end_date > ?
        AND (sg.end_date IS NULL OR sg.end_date >= ?)
        AND ta.status = 'scheduled'
        AND (ts.id IS NULL OR ts.status = 'in_progress')
      ORDER BY ta.end_date ASC
      LIMIT 3
    `;
    upcomingDeadlines = await executeQuery(deadlinesQuery, [studentId, studentId, now, now]);
  } catch (e) {
  }
  let recentGrades = [];
  try {
    const gradesQuery = `
      SELECT 
        g.id,
        g.grade,
        g.comment,
        g.graded_at,
        se.title as event_title,
        c.name as course_name,
        100 as max_grade
      FROM grades g
      JOIN schedule_events se ON g.schedule_event_id = se.id
      JOIN study_groups sg ON se.group_id = sg.id
      JOIN courses c ON sg.course_id = c.id
      WHERE g.student_id = ?
      ORDER BY g.graded_at DESC
      LIMIT 5
    `;
    recentGrades = await executeQuery(gradesQuery, [studentId]);
  } catch (e) {
  }
  return {
    upcomingEvents,
    activeCourses: coursesWithProgress,
    upcomingDeadlines,
    recentGrades
  };
}

export { getStudentCourseDetails as a, getStudentCourses as b, getStudentDashboardStats as g };
//# sourceMappingURL=studentCourseRepository.mjs.map
