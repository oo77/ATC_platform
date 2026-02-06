# AI-импорт сертификатов для Telegram Mini App

## План реализации

### Этап 1: Backend API для ТГ ✅

- [x] **1.1** `server/api/tg-app/certificates/ai-batch/upload.post.ts`
  - Загрузка файлов через FormData
  - Валидация organizationId и representativeId
  - Сохранение во временное хранилище
  - Логирование действий

- [x] **1.2** `server/api/tg-app/certificates/ai-batch/analyze.post.ts`
  - AI-анализ изображений через Vision API
  - Поиск студентов **ТОЛЬКО по organizationId**
  - Проверка дублирования по номеру сертификата
  - Возврат топ-5 кандидатов с matchScore

- [x] **1.3** `server/api/tg-app/certificates/ai-batch/confirm.post.ts`
  - Транзакционное сохранение сертификатов
  - Запрет создания новых студентов
  - Проверка принадлежности студента организации
  - Сохранение original_file_url для скачивания

### Этап 2: Расширение StudentMatcher ✅

- [x] **2.1** `server/repositories/studentRepository.ts`
  - Добавлен метод `getStudentsByOrganizationId(organizationId)`
  - Используется для ограничения поиска студентов

### Этап 3: Frontend - Компоненты ✅

- [x] **3.1** `app/components/tg-app/CertificateAIUploadTab.vue`
  - Wizard с 4 шагами
  - Drag & drop загрузка
  - AI-анализ с прогрессом
  - Выбор студентов из топ-5 кандидатов
  - Отображение дубликатов
  - Подтверждение и импорт

- [x] **3.2** `app/components/tg-app/CertificateUploadWrapper.vue`
  - Переключатель между AI и ручным режимом
  - AI режим по умолчанию с бейджем "Новое"

- [x] **3.3** Переименование:
  - `CertificateUploadTab.vue` → `CertificateManualUploadTab.vue`
  - Новый `CertificateUploadTab.vue` как обёртка

### Этап 4: Исправление скачивания ✅

- [x] **4.1** `server/api/tg-app/students/[id].get.ts`
  - Добавлен `original_file_url` в SELECT
  - `hasPdf` теперь true если есть pdfFileUrl ИЛИ originalFileUrl
  - Fallback на originalFileUrl при отсутствии pdfFileUrl

- [x] **4.2** `server/api/tg-app/send-certificate.post.ts`
  - Поддержка абсолютных путей файловой системы
  - Корректное чтение AI-импортированных файлов

---

## Ключевые отличия от платформенного batch-импорта

| Аспект                   | Платформа              | ТГ приложение                    |
| ------------------------ | ---------------------- | -------------------------------- |
| Поиск студентов          | Все студенты в БД      | Только своя организация          |
| Создание нового студента | Доступно               | **Запрещено**                    |
| Проверка дублей          | На этапе подтверждения | На этапе анализа + подтверждения |
| Права доступа            | CERTIFICATES_ISSUE     | can_upload_certificates          |

## Дальнейшие улучшения (опционально)

- [ ] Перемещение временных файлов в постоянное хранилище
- [ ] Генерация PDF из шаблона для AI-импортированных сертификатов
- [ ] Добавление редактирования извлечённых данных на шаге 3
- [ ] Уведомления в Telegram бот о результатах импорта
