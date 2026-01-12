# Инструкция по тестированию Dashboard

## Что было реализовано

✅ **Этап 1-4 ЗАВЕРШЕНЫ**

Созданы Dashboard для всех ролей:
- **STUDENT** — уже существовал, работает
- **TEACHER** — создан с нуля
- **MANAGER** — создан с нуля  
- **ADMIN** — создан с нуля

## Созданные файлы

### Компоненты Dashboard

```
app/components/dashboard/
├── StudentDashboard.vue      ✅ Существовал
├── TeacherDashboard.vue      ✅ Создан
├── ManagerDashboard.vue      ✅ Создан
├── AdminDashboard.vue        ✅ Создан
└── widgets/
    ├── StatsCard.vue         ✅ Создан
    └── QuickActions.vue      ✅ Создан
```

### API Endpoints

```
server/api/
├── students/dashboard.get.ts  ✅ Существовал
├── teacher/dashboard.get.ts   ✅ Создан
├── manager/dashboard.get.ts   ✅ Создан
└── admin/dashboard.get.ts     ✅ Создан
```

### Главная страница

```
app/pages/index.vue            ✅ Обновлён (маршрутизация по ролям)
```

## Как протестировать

### 1. Запустить dev сервер

Сервер уже запущен:
```bash
npm run dev
```

### 2. Войти под разными ролями

#### Тест STUDENT Dashboard
1. Войти как студент
2. Перейти на `/` (главная страница)
3. Должен отобразиться `StudentDashboard.vue` с:
   - Приветствием
   - Ближайшими занятиями
   - Горящими дедлайнами
   - Активными курсами

#### Тест TEACHER Dashboard
1. Войти как преподаватель (TEACHER role)
2. Перейти на `/` (главная страница)
3. Должен отобразиться `TeacherDashboard.vue` с:
   - 4 карточки статистики (группы, студенты, занятия, часы)
   - Занятия на сегодня
   - Мои группы с посещаемостью
   - Незаполненная посещаемость (если есть)
   - Расписание на неделю

**API:** `GET /api/teacher/dashboard`

#### Тест MANAGER Dashboard
1. Войти как менеджер (MANAGER role)
2. Перейти на `/` (главная страница)
3. Должен отобразиться `ManagerDashboard.vue` с:
   - 4 карточки статистики
   - Группы в работе (с прогрессом)
   - Расписание на сегодня
   - Группы завершающиеся в ближайшие 7 дней
   - Алерты (студенты требующие внимания)
   - Статистика за месяц

**API:** `GET /api/manager/dashboard`

#### Тест ADMIN Dashboard
1. Войти как администратор (ADMIN role)
2. Перейти на `/` (главная страница)
3. Должен отобразиться `AdminDashboard.vue` с:
   - 4 карточки статистики
   - Системная статистика (пользователи, сессии, логи)
   - Системные уведомления
   - Последние действия (activity logs)
   - График активности за неделю

**API:** `GET /api/admin/dashboard`

## Возможные проблемы и решения

### Проблема 1: "Cannot find module"

**Причина:** Nuxt не подхватил новые компоненты

**Решение:**
```bash
# Перезапустить dev сервер
Ctrl+C
npm run dev
```

### Проблема 2: API возвращает 500

**Причина:** Таблицы в БД могут отсутствовать (activity_logs, test_assignments и т.д.)

**Решение:** API написаны с try-catch блоками и вернут пустые данные если таблиц нет

### Проблема 3: Нет данных на Dashboard

**Причина:** В БД нет данных для текущего пользователя

**Решение:** 
- Для TEACHER: нужно назначить преподавателя на группу через schedule_events
- Для MANAGER/ADMIN: данные берутся из общих таблиц
- Для STUDENT: уже работает

### Проблема 4: Не переключается Dashboard при смене роли

**Причина:** Кэш composable `usePermissions`

**Решение:** Выйти и войти заново

## Проверка API напрямую

### Через браузер (если авторизован)

```
GET http://localhost:3000/api/teacher/dashboard
GET http://localhost:3000/api/manager/dashboard
GET http://localhost:3000/api/admin/dashboard
GET http://localhost:3000/api/students/dashboard
```

### Через curl (с токеном)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/teacher/dashboard
```

## Структура ответа API

### Teacher Dashboard
```json
{
  "isTeacher": true,
  "myGroups": 2,
  "myStudents": 24,
  "todayLessons": 3,
  "monthlyHours": 36,
  "todaySchedule": [...],
  "groups": [...],
  "weekSchedule": [...],
  "pendingAttendance": [...]
}
```

### Manager Dashboard
```json
{
  "isManager": true,
  "activeGroups": 8,
  "studentsOnCourses": 156,
  "testsToday": 2,
  "certificatesPending": 5,
  "groups": [...],
  "todaySchedule": [...],
  "groupsEndingSoon": [...],
  "alerts": [...],
  "monthlyStats": {...}
}
```

### Admin Dashboard
```json
{
  "isAdmin": true,
  "totalStudents": 245,
  "studentsTrend": 5,
  "totalInstructors": 12,
  "activeGroups": 8,
  "certificatesThisMonth": 34,
  "totalUsers": 268,
  "todayRegistrations": 3,
  "activeSessions": 12,
  "todayLogs": 1234,
  "systemAlerts": [...],
  "recentActivities": [...],
  "weeklyActivity": [...]
}
```

## Следующие шаги

### Этап 5: Улучшение студенческого Dashboard

- [ ] Добавить виджет быстрых действий в StudentDashboard
- [ ] Добавить виджет последних оценок
- [ ] Улучшить систему уведомлений

### Дополнительные улучшения

- [ ] Добавить real-time обновления (WebSocket)
- [ ] Добавить экспорт статистики в PDF/Excel
- [ ] Добавить настройку виджетов Dashboard
- [ ] Добавить темную тему для графиков

---

**Дата создания:** 09.01.2026  
**Статус:** Этапы 1-4 завершены ✅
