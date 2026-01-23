-- Диагностический SQL-скрипт для проверки связей студента с курсами
-- Замените 'USER_EMAIL' на email студента, у которого не отображаются курсы

SET @user_email = 'USER_EMAIL'; -- ЗАМЕНИТЕ НА РЕАЛЬНЫЙ EMAIL

-- 1. Проверяем пользователя
SELECT 'Step 1: User Info' as step;
SELECT id, email, role, student_id, name 
FROM users 
WHERE email = @user_email;

-- 2. Проверяем запись студента по user_id из users
SELECT 'Step 2: Student via users.student_id' as step;
SELECT s.* 
FROM students s
JOIN users u ON u.student_id = s.id
WHERE u.email = @user_email;

-- 3. Проверяем запись студента по students.user_id
SELECT 'Step 3: Student via students.user_id' as step;
SELECT s.* 
FROM students s
WHERE s.user_id = (SELECT id FROM users WHERE email = @user_email LIMIT 1);

-- 4. Проверяем членство в группах
SELECT 'Step 4: Group Membership' as step;
SELECT sgs.*, sg.code as group_code, c.name as course_name
FROM study_group_students sgs
JOIN study_groups sg ON sgs.group_id = sg.id
JOIN courses c ON sg.course_id = c.id
WHERE sgs.student_id IN (
  SELECT s.id FROM students s 
  WHERE s.user_id = (SELECT id FROM users WHERE email = @user_email LIMIT 1)
  OR s.id = (SELECT student_id FROM users WHERE email = @user_email LIMIT 1)
);

-- 5. Полный запрос как в коде
SELECT 'Step 5: Full Query (as in code)' as step;
SELECT 
  sg.id as group_id, 
  c.id as course_id, 
  c.name as course_name, 
  sg.code as group_name,
  s.id as student_id,
  s.full_name as student_name
FROM students s
JOIN study_group_students sgs ON s.id = sgs.student_id
JOIN study_groups sg ON sgs.group_id = sg.id
JOIN courses c ON sg.course_id = c.id
WHERE s.id IN (
  SELECT s2.id FROM students s2 
  WHERE s2.user_id = (SELECT id FROM users WHERE email = @user_email LIMIT 1)
  UNION
  SELECT student_id FROM users WHERE email = @user_email LIMIT 1
);
