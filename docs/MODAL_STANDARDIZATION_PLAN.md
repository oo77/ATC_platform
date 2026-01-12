# План стандартизации модальных окон

Цель: Привести все модальные окна к единому стилю поведения и внешнему виду.
1. Одинаковая анимация и размытый фон.
2. Закрытие только через кнопку "X".
3. Запрет закрытия по клику на фон (backdrop).

## 1. Базовые компоненты UI

- [x] **app/components/ui/Modal.vue**
  - [x] Изменить дефолтное значение `closeOnBackdrop` на `false`.
  - [x] Убедиться в наличии стилей `backdrop-blur` (усилить при необходимости).
  - [x] Проверить анимации.

- [x] **app/components/ui/ConfirmModal.vue**
  - [x] Проверить передачу пропса `closeOnBackdrop` (удалено явное связывание).
  - [x] Убедиться, что поведение соответствует требованию.

- [x] **app/components/profile/Modal.vue**
  - [x] Привести в соответствие с `UiModal` (отключить закрытие по клику на фон).
  - [x] Унифицировать стили фона и анимации.

## 2. Проверка и рефакторинг компонентов

Будет произведена проверка использования `UiModal` и удаление явных переопределений `:close-on-backdrop="true"`, если таковые имеются.

### Сертификаты
- [x] app/components/certificates/BulkIssueModal.vue (использует дефолт UiModal)
- [x] app/components/certificates/ResultsModal.vue (использует дефолт UiModal)
- [x] app/components/certificates/TemplateEditModal.vue (использует дефолт UiModal)
- [x] app/components/certificates/TemplateFormModal.vue (использует дефолт UiModal)
- [x] app/components/certificates/WarningsModal.vue (использует дефолт UiModal)

### База данных и Студенты
- [x] app/components/database/CertificateDetailModal.vue (использует дефолт UiModal)
- [x] app/components/database/CertificateManualFormModal.vue (использует дефолт UiModal)
- [x] app/components/database/StudentCertificatesModal.vue (использует дефолт UiModal)
- [x] app/components/database/StudentFormModal.vue (использует дефолт UiModal)

### Файлы
- [x] app/components/files/CreateFolderModal.vue (использует дефолт UiModal)
- [x] app/components/files/FilePreviewModal.vue (использует дефолт UiModal)
- [x] app/components/files/RenameModal.vue (использует дефолт UiModal)
- [x] app/components/files/SetPasswordModal.vue (использует дефолт UiModal)
- [x] app/components/files/UnlockFolderModal.vue (использует дефолт UiModal)

### Группы
- [x] app/components/groups/GroupFormModal.vue (использует дефолт UiModal)
- [x] app/components/groups/ManageStudentsModal.vue (использует дефолт UiModal)

### Программы
- [x] app/components/programs/CreateDisciplineModal.vue (использует дефолт UiModal)
- [x] app/components/programs/DisciplineFormModal.vue (использует дефолт UiModal)

### Тестирование
- [x] app/components/test-bank/ImportQuestionsModal.vue (использует дефолт UiModal)
- [x] app/components/tests/LanguageSelectModal.vue (отредактировано: удален close-on-backdrop)
- [x] app/components/attendance/TestResultsModal.vue (использует дефолт UiModal)

### Пользователи
- [x] app/components/users/InstructorFormModal.vue (использует дефолт UiModal)
- [x] app/components/users/UserFormModal.vue (использует дефолт UiModal)

### Расписание
- [x] app/components/schedule/EventDetailModal.vue (использует дефолт UiModal)
- [x] app/components/schedule/EventModal.vue (использует дефолт UiModal)

### Организации и Представители
- [x] app/components/organizations/OrganizationDetailModal.vue (использует дефолт UiModal)
- [x] app/components/organizations/OrganizationFormModal.vue (использует дефолт UiModal)
- [x] app/components/representatives/ApproveRepresentativeModal.vue (использует дефолт UiModal)
- [x] app/components/representatives/BlockRepresentativeModal.vue (использует дефолт UiModal)
- [x] app/components/representatives/RepresentativeDetailModal.vue (использует дефолт UiModal)

### Профиль
- [x] app/components/profile/AddressCard.vue (проверено: использует profile/Modal, кнопка закрытия есть)
- [x] app/components/profile/PersonalInfoCard.vue (проверено: использует profile/Modal, кнопка закрытия есть)
