# BaseButton Component

Универсальный компонент кнопки с поддержкой различных вариантов оформления, размеров и состояний.

## Основное использование

```vue
<BaseButton variant="primary">
  Нажми меня
</BaseButton>
```

## Props

### variant

- **Тип:** `'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'ghost'`
- **По умолчанию:** `'primary'`
- **Описание:** Определяет цветовую схему кнопки

**Варианты:**

- `primary` - Синий цвет, для основных действий
- `success` - Зеленый цвет, для позитивных действий (создание, сохранение)
- `danger` - Красный цвет, для опасных действий (удаление)
- `warning` - Желтый цвет, для предупреждающих действий
- `secondary` - Серый цвет, для второстепенных действий
- `ghost` - Прозрачный фон, для минималистичных действий

### size

- **Тип:** `'sm' | 'md' | 'lg'`
- **По умолчанию:** `'md'`
- **Описание:** Размер кнопки

### disabled

- **Тип:** `boolean`
- **По умолчанию:** `false`
- **Описание:** Отключает кнопку

### loading

- **Тип:** `boolean`
- **По умолчанию:** `false`
- **Описание:** Показывает индикатор загрузки и отключает кнопку

### outline

- **Тип:** `boolean`
- **По умолчанию:** `false`
- **Описание:** Использует стиль с обводкой вместо заливки

### block

- **Тип:** `boolean`
- **По умолчанию:** `false`
- **Описание:** Растягивает кнопку на всю ширину родительского элемента

### tag

- **Тип:** `'button' | 'a' | 'NuxtLink'`
- **По умолчанию:** `'button'`
- **Описание:** HTML-тег или компонент для рендеринга

### type

- **Тип:** `'button' | 'submit' | 'reset'`
- **По умолчанию:** `'button'`
- **Описание:** Тип кнопки (применяется только если tag='button')

## Slots

### default

Основной контент кнопки

### iconLeft

Иконка слева от текста

### iconRight

Иконка справа от текста

## Events

### @click

Вызывается при клике на кнопку (не вызывается если кнопка disabled или loading)

## Примеры использования

### Базовые варианты

```vue
<BaseButton variant="primary">Primary</BaseButton>
<BaseButton variant="success">Success</BaseButton>
<BaseButton variant="danger">Danger</BaseButton>
<BaseButton variant="warning">Warning</BaseButton>
```

### С обводкой

```vue
<BaseButton variant="primary" outline>Primary Outline</BaseButton>
<BaseButton variant="success" outline>Success Outline</BaseButton>
```

### Разные размеры

```vue
<BaseButton size="sm">Small</BaseButton>
<BaseButton size="md">Medium</BaseButton>
<BaseButton size="lg">Large</BaseButton>
```

### С иконками

```vue
<BaseButton variant="success">
  <template #iconLeft>
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  </template>
  Добавить
</BaseButton>

<BaseButton variant="primary">
  Скачать
  <template #iconRight>
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  </template>
</BaseButton>
```

### Состояния

```vue
<BaseButton :loading="true">Загрузка...</BaseButton>
<BaseButton :disabled="true">Отключена</BaseButton>
```

### Блочная кнопка

```vue
<BaseButton variant="primary" block>
  Блочная кнопка
</BaseButton>
```

### В формах

```vue
<form @submit.prevent="handleSubmit">
  <div class="flex justify-end gap-3">
    <BaseButton variant="secondary" outline @click="cancel">
      Отмена
    </BaseButton>
    <BaseButton variant="success" type="submit" :loading="isSubmitting">
      Сохранить
    </BaseButton>
  </div>
</form>
```

### Действия в таблице

```vue
<div class="flex gap-2">
  <BaseButton variant="primary" size="sm" @click="edit(item)">
    <template #iconLeft>
      <EditIcon class="w-4 h-4" />
    </template>
    Изменить
  </BaseButton>
  <BaseButton variant="danger" size="sm" @click="remove(item)">
    <template #iconLeft>
      <DeleteIcon class="w-4 h-4" />
    </template>
    Удалить
  </BaseButton>
</div>
```

## Рекомендации по использованию

### Семантика цветов

1. **Primary (синий)** - используйте для основных действий:

   - Вход в систему
   - Редактирование
   - Просмотр деталей
   - Основное действие на странице

2. **Success (зеленый)** - используйте для позитивных действий:

   - Создание новых записей
   - Сохранение изменений
   - Подтверждение
   - Успешное завершение

3. **Danger (красный)** - используйте для опасных действий:

   - Удаление
   - Отмена необратимых операций
   - Критические действия

4. **Warning (желтый)** - используйте для предупреждающих действий:

   - Действия, требующие внимания
   - Временная блокировка
   - Изменение важных настроек

5. **Secondary (серый)** - используйте для второстепенных действий:

   - Отмена
   - Назад
   - Закрыть
   - Альтернативные действия

6. **Ghost (прозрачный)** - используйте для минималистичных действий:
   - Вспомогательные действия
   - Действия в компактных интерфейсах

### Размеры

- **sm** - используйте в таблицах, карточках, компактных интерфейсах
- **md** - стандартный размер для большинства случаев
- **lg** - используйте для важных призывов к действию (CTA)

### Outline vs Solid

- **Solid** (по умолчанию) - для основных действий
- **Outline** - для второстепенных действий или когда нужно уменьшить визуальный вес

## Доступность

Компонент автоматически:

- Устанавливает `disabled` атрибут при `disabled` или `loading`
- Добавляет `focus:ring` для клавиатурной навигации
- Показывает индикатор загрузки вместо иконки при `loading`
