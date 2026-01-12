# Исправление: Failed to resolve component

## Проблема

При загрузке страницы возникали ошибки:
```
Failed to resolve component: DashboardManagerDashboard
Failed to resolve component: DashboardAdminDashboard
Failed to resolve component: DashboardTeacherDashboard
```

## Причина

В Nuxt 3/4 компоненты из папки `components/dashboard/` автоматически регистрируются с префиксом `Dashboard`. 

Если файл называется `AdminDashboard.vue`, то компонент будет доступен как `DashboardAdminDashboard`, что создаёт дублирование.

## Решение

### 1. Переименованы файлы компонентов

**Было:**
```
app/components/dashboard/
├── AdminDashboard.vue
├── ManagerDashboard.vue
├── TeacherDashboard.vue
├── StudentDashboard.vue
└── widgets/
```

**Стало:**
```
app/components/dashboard/
├── Admin.vue
├── Manager.vue
├── Teacher.vue
├── Student.vue
└── widgets/
```

### 2. Обновлён index.vue

**Было:**
```vue
<DashboardStudentDashboard v-if="isStudent" />
<DashboardTeacherDashboard v-else-if="isTeacher" />
<DashboardManagerDashboard v-else-if="isManager" />
<DashboardAdminDashboard v-else-if="isAdmin" />
```

**Стало:**
```vue
<DashboardStudent v-if="isStudent" />
<DashboardTeacher v-else-if="isTeacher" />
<DashboardManager v-else-if="isManager" />
<DashboardAdmin v-else-if="isAdmin" />
```

## Как работает автоимпорт в Nuxt

Nuxt автоматически регистрирует компоненты из папки `components/` с префиксом, основанным на структуре папок:

| Файл | Автоматическое имя компонента |
|------|------------------------------|
| `components/MyButton.vue` | `<MyButton />` |
| `components/base/Button.vue` | `<BaseButton />` |
| `components/dashboard/Admin.vue` | `<DashboardAdmin />` |
| `components/dashboard/widgets/Stats.vue` | `<DashboardWidgetsStats />` |

## Проверка

После исправления:
1. ✅ Сервер автоматически перезагрузился (HMR)
2. ✅ Компоненты успешно резолвятся
3. ✅ Страница загружается без ошибок

## Статус

✅ **ИСПРАВЛЕНО** — все компоненты Dashboard работают корректно

---

**Дата:** 09.01.2026  
**Время:** 00:23
