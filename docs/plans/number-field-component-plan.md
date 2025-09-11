# Text Field Component Implementation Plan

## Обзор

Создание универсального переиспользуемого компонента `TextFieldComponent` для унификации всех типов текстовых полей в проекте. Компонент будет основан на существующем паттерне `SelectFieldComponent` и интегрирован в shared/ui слой согласно Feature-Sliced Design архитектуре.

## Текущая ситуация

### Проблема
В коде форм повторяется один и тот же паттерн для текстовых полей разных типов:

**Числовые поля:**
```html
<label tuiLabel class="basic-data-form__field-label">Weight (kg)
  <tui-textfield>
    <input
      tuiInputNumber
      id="weight"
      formControlName="weight"
      placeholder="Enter weight"
      [min]="30"
      [max]="300"
    />
  </tui-textfield>
</label>
```

**Текстовые поля (потенциальные случаи):**
```html
<!-- Email поля -->
<label tuiLabel>Email
  <tui-textfield>
    <input type="email" formControlName="email" placeholder="Enter email" />
  </tui-textfield>
</label>

<!-- Пароли -->
<label tuiLabel>Password
  <tui-textfield>
    <input type="password" formControlName="password" placeholder="Enter password" />
  </tui-textfield>
</label>

<!-- Обычный текст -->
<label tuiLabel>Name
  <tui-textfield>
    <input type="text" formControlName="name" placeholder="Enter name" />
  </tui-textfield>
</label>
```

### Выявленные паттерны
1. Единообразная структура с `tuiLabel` и `tui-textfield`
2. Различные типы input: `text`, `email`, `password`, `number` (с `tuiInputNumber`)
3. Общие атрибуты: `placeholder`, `formControlName`, `disabled`
4. Специфичные для числовых полей: `min`, `max`, `step`, `precision`
5. Специфичные для текстовых: `maxlength`, `minlength`, `pattern`
6. Необходимость интеграции с Angular Reactive Forms

## Архитектурное решение

### Расположение компонента
```
src/shared/ui/text-field/
├── text-field.component.ts
├── text-field.component.html
├── text-field.component.scss
├── text-field.component.spec.ts
└── index.ts
```

### Интеграция в FSD архитектуру
- **Слой**: `shared/ui` (переиспользуемые UI компоненты)
- **Импорт**: Компонент будет доступен через `@/shared`
- **Зависимости**: Только от Taiga UI и Angular Forms

## Техническая спецификация

### 1. Интерфейсы и типы

```typescript
// Тип поля ввода
export type TextFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

// Интерфейс для числовых ограничений
interface NumberConstraints {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

// Интерфейс для текстовых ограничений  
interface TextConstraints {
  minlength?: number;
  maxlength?: number;
  pattern?: string;
}
```

### 2. Input параметры

```typescript
// Обязательные
readonly label = input.required<string>();
readonly placeholder = input.required<string>();
readonly type = input<TextFieldType>('text');

// Опциональные общие
readonly disabled = input<boolean>(false);
readonly required = input<boolean>(false);
readonly readonly = input<boolean>(false);
readonly suffix = input<string>(''); // единицы измерения (kg, cm) или иконки

// Для числовых полей (используются только если type === 'number')
readonly min = input<number>();
readonly max = input<number>();
readonly step = input<number>(1);
readonly precision = input<number>(0); // количество знаков после запятой

// Для текстовых полей
readonly minlength = input<number>();
readonly maxlength = input<number>();
readonly pattern = input<string>(); // regex паттерн

// Для стилизации
readonly size = input<'s' | 'm' | 'l'>('m'); // размер поля
readonly appearance = input<'outline' | 'fill'>('outline'); // вид
```

### 3. Output события

```typescript
readonly valueChange = output<string | null>(); // всегда строка для унификации
```

### 4. ControlValueAccessor реализация

Компонент должен реализовать `ControlValueAccessor` для интеграции с Angular Reactive Forms:

```typescript
implements ControlValueAccessor {
  // Методы CVA - всегда работаем со строками
  writeValue(value: string | null): void
  registerOnChange(fn: (value: string | null) => void): void
  registerOnTouched(fn: () => void): void
  setDisabledState?(isDisabled: boolean): void
}
```

### 5. Валидация

Встроенная валидация зависит от типа поля:

**Для числовых полей (type === 'number'):**
- Минимальное значение (`min`)
- Максимальное значение (`max`)
- Обязательность поля (`required`)
- Числовой формат (`step`, `precision`)

**Для текстовых полей:**
- Минимальная длина (`minlength`)
- Максимальная длина (`maxlength`)
- Паттерн (`pattern` regex)
- Обязательность поля (`required`)

**Для email полей:**
- Валидный email формат
- Обязательность поля (`required`)

**Для password полей:**
- Минимальная длина
- Сложность пароля (если задан `pattern`)

### 6. Template структура

Используем `tui-textfield` как оболочку и директивы Taiga на стандартном `input`:

```html
@switch (type()) {
  @case ('number') {
    <label tuiLabel class="text-field__label">
      <div class="text-field__label-text">
        {{ label() }}
        @if (required()) {<span class="text-field__required">*</span>}
        @if (suffix(); as suffixText) {<span class="text-field__suffix">({{ suffixText }})</span>}
      </div>
      <tui-textfield [tuiTextfieldSize]="size()">
        <input
          tuiInputNumber
          [placeholder]="placeholder()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [tuiNumberFormat]="numberFormat()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [ngModel]="currentValue()"
          (ngModelChange)="onValueChange($event)"
        />
      </tui-textfield>
    </label>
  }
  
  @case ('tel') {
    <label tuiLabel class="text-field__label">
      <div class="text-field__label-text">
        {{ label() }}
        @if (required()) {<span class="text-field__required">*</span>}
      </div>
      <tui-textfield [tuiTextfieldSize]="size()">
        <input
          tuiInputPhone
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [ngModel]="currentValue()"
          (ngModelChange)="onValueChange($event)"
        />
      </tui-textfield>
    </label>
  }
  
  @default {
    <label tuiLabel class="text-field__label">
      <div class="text-field__label-text">
        {{ label() }}
        @if (required()) {<span class="text-field__required">*</span>}
        @if (suffix(); as suffixText) {<span class="text-field__suffix">({{ suffixText }})</span>}
      </div>
      <tui-textfield [tuiTextfieldSize]="size()">
        <input
          [type]="type()"
          [placeholder]="placeholder()"
          [minlength]="minlength()"
          [maxlength]="maxlength()"
          [pattern]="pattern()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [ngModel]="currentValue()"
          (ngModelChange)="onValueChange($event)"
        />
      </tui-textfield>
    </label>
  }
}
```

## Пошаговый план реализации

### Этап 1: Создание базового компонента
**Цель**: Создать минимальную работающую версию

**Задачи**:
1. Создать файловую структуру компонента
2. Реализовать базовый TypeScript класс с обязательными input параметрами
3. Создать минимальный HTML template
4. Добавить базовые стили
5. Создать базовые тесты
6. Экспортировать компонент через `index.ts`

**Файлы для создания**:
- `text-field.component.ts` - основная логика с поддержкой разных типов
- `text-field.component.html` - template с условной логикой для типов
- `text-field.component.scss` - стили для всех вариантов
- `text-field.component.spec.ts` - тесты для всех типов полей
- `index.ts` - экспорт и типы

### Этап 2: Реализация ControlValueAccessor
**Цель**: Интеграция с Angular Forms

**Задачи**:
1. Имплементировать интерфейс `ControlValueAccessor`
2. Добавить поддержку `formControlName`
3. Реализовать двустороннее связывание данных
4. Добавить обработку состояния disabled
5. Протестировать интеграцию с формами

**Критерии готовности**:
- Компонент работает с `formControlName`
- Корректная обработка `writeValue`, `registerOnChange`, `registerOnTouched`
- Поддержка `setDisabledState`

### Этап 3: Расширенная функциональность
**Цель**: Добавить дополнительные возможности для всех типов полей

**Задачи**:
1. **Для числовых полей**: поддержка `precision`, `min`, `max`, `step`
2. **Для текстовых полей**: поддержка `minlength`, `maxlength`, `pattern`
3. **Для всех типов**: отображение суффиксов (`suffix`)
4. Улучшить валидацию для каждого типа поля
5. Добавить поддержку разных размеров (`size`) и внешнего вида (`appearance`)
6. Добавить ARIA атрибуты для доступности

### Этап 4: Стилизация и UX
**Цель**: Привести к единому дизайну проекта

**Задачи**:
1. Интегрировать с существующей системой дизайна
2. Добавить стили для состояний (focus, error, disabled)
3. Обеспечить адаптивность для мобильных устройств
4. Добавить анимации при необходимости
5. Протестировать в разных браузерах

### Этап 5: Интеграция в проект
**Цель**: Заменить существующие реализации во всех формах

**Задачи**:
1. Обновить экспорты в `shared/index.ts`
2. **Заменить числовые поля** в `basic-data-form.component.html`
3. **Подготовить к будущему использованию** в других формах (профиль пользователя, настройки)
4. Обновить стили форм для единообразного внешнего вида
5. Запустить тесты для проверки регрессий
6. Обновить документацию в `docs/`

### Этап 6: Тестирование и документация
**Цель**: Обеспечить качество и удобство использования

**Задачи**:
1. Написать полный набор unit тестов
2. Протестировать интеграцию с различными формами
3. Проверить покрытие тестами (минимум 80%)
4. Создать примеры использования
5. Обновить проектную документацию

## Детали реализации

### Imports и Dependencies

```typescript
import { ChangeDetectionStrategy, Component, input, output, signal, computed } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

// Taiga UI оболочка и директивы
import { TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber, TuiInputPhone } from '@taiga-ui/kit';
import type { TuiNumberFormat } from '@taiga-ui/core';

// Размеры
import { TuiSizeS, TuiSizeM, TuiSizeL } from '@taiga-ui/core';

// Типы
export type TextFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
export type TextFieldSize = TuiSizeS | TuiSizeM | TuiSizeL;
```

### Provider конфигурация

```typescript
providers: [
  {
    provide: NG_VALUE_ACCESSOR,
    useExisting: TextFieldComponent,
    multi: true,
  },
]
```

### Signals архитектура

```typescript
// Внутренние сигналы
private readonly internalValue = signal<string | null>(null);
private readonly isFocused = signal<boolean>(false);
private readonly isTouched = signal<boolean>(false);

// Computed значения
readonly currentValue = computed(() => this.internalValue());

// Computed для числового формата (только для числовых полей)
readonly numberFormat = computed((): TuiNumberFormat | null => {
  if (this.type() !== 'number') return null;
  
  return {
    precision: this.precision(),
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalMode: 'always',
    rounding: 'round'
  };
});

// Валидация для числовых полей
readonly hasNumberError = computed(() => {
  if (this.type() !== 'number') return false;
  const raw = this.internalValue();
  if (raw === null || raw === '') return false;
  const value = Number(raw);
  if (Number.isNaN(value)) return true;
  const min = this.min();
  const max = this.max();
  return (min !== undefined && value < min) || (max !== undefined && value > max);
});

// Валидация для текстовых полей
readonly hasTextError = computed(() => {
  if (this.type() === 'number') return false;
  const value = this.internalValue() as string;
  const minlength = this.minlength();
  const maxlength = this.maxlength();
  const pattern = this.pattern();
  
  if (!value) return false;
  
  return (
    (minlength !== undefined && value.length < minlength) ||
    (maxlength !== undefined && value.length > maxlength) ||
    (pattern && !new RegExp(pattern).test(value))
  );
});

// Общая валидация
readonly hasError = computed(() => this.hasNumberError() || this.hasTextError());
```

### Использование компонента

После реализации компонент будет использоваться так:

```html
<!-- Числовые поля -->
<app-text-field
  type="number"
  label="Age"
  placeholder="Enter age"
  [min]="10"
  [max]="120"
  formControlName="age"
/>

<app-text-field
  type="number"
  label="Weight"
  placeholder="Enter weight"
  [min]="30"
  [max]="300"
  suffix="kg"
  formControlName="weight"
/>

<!-- Десятичные числа -->
<app-text-field
  type="number"
  label="Body Fat Percentage"
  placeholder="Enter percentage"
  [min]="5"
  [max]="50"
  [precision]="1"
  [step]="0.1"
  suffix="%"
  formControlName="bodyFat"
/>

<!-- Текстовые поля -->
<app-text-field
  type="text"
  label="Full Name"
  placeholder="Enter your full name"
  [minlength]="2"
  [maxlength]="50"
  [required]="true"
  formControlName="fullName"
/>

<!-- Email поля -->
<app-text-field
  type="email"
  label="Email Address"
  placeholder="Enter your email"
  [required]="true"
  formControlName="email"
/>

<!-- Пароли -->
<app-text-field
  type="password"
  label="Password"
  placeholder="Enter password"
  [minlength]="8"
  [maxlength]="128"
  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$"
  [required]="true"
  formControlName="password"
/>

<!-- Телефон -->
<app-text-field
  type="tel"
  label="Phone Number"
  placeholder="+1 (555) 123-4567"
  pattern="^\+?[1-9]\d{1,14}$"
  formControlName="phone"
/>

<!-- URL -->
<app-text-field
  type="url"
  label="Website"
  placeholder="https://example.com"
  formControlName="website"
/>

<!-- С настройками размера и внешнего вида -->
<app-text-field
  type="text"
  label="Short Input"
  placeholder="Small field"
  size="s"
  appearance="fill"
  formControlName="shortInput"
/>
```

## Рефакторинг существующего кода

### Файлы для изменения:

1. **`src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.html`**
   ```html
   <!-- Заменить с: -->
   <div class="basic-data-form__field">
     <label tuiLabel class="basic-data-form__field-label">Age
     <tui-textfield>
       <input tuiInputNumber id="age" formControlName="age" placeholder="Enter age" [min]="10" [max]="120" />
     </tui-textfield>
     </label>
   </div>

   <!-- На: -->
   <div class="basic-data-form__field">
     <app-text-field
       label="Age"
       placeholder="Enter age"
       [min]="10"
       [max]="120"
       formControlName="age"
     />
   </div>
   ```

2. **`src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.ts`**
   - Добавить импорт `TextFieldComponent`
   - Обновить массив imports в декораторе компонента

3. **`src/shared/index.ts`**
   - Добавить экспорт `TextFieldComponent`

## Тестирование

### Unit тесты

```typescript
describe('TextFieldComponent', () => {
  describe('Component Creation', () => {
    it('should create component with required inputs');
    it('should throw error if required inputs are missing');
  });

  describe('Value Handling', () => {
    it('should emit valueChange when value changes');
    it('should handle null values correctly');
    it('should respect min/max constraints');
  });

  describe('ControlValueAccessor', () => {
    it('should implement writeValue correctly');
    it('should call onChange when value changes');
    it('should handle disabled state');
  });

  describe('Form Integration', () => {
    it('should work with reactive forms');
    it('should validate min/max in form context');
    it('should show validation errors');
  });
});
```

### Integration тесты

```typescript
describe('TextField Form Integration', () => {
  it('should integrate with basic-data-form correctly');
  it('should maintain form validation state');
  it('should preserve existing form behavior');
});
```

## Критерии качества

### Производительность
- Использование OnPush change detection
- Минимальное количество re-renders
- Efficient signal usage

### Доступность (A11y)
- Корректные ARIA атрибуты
- Поддержка клавиатурной навигации
- Семантически правильная разметка

### Тестирование
- Покрытие тестами минимум 80%
- Тесты для всех публичных методов
- Тесты интеграции с формами

### Совместимость
- Работа во всех поддерживаемых браузерах
- Корректная работа на мобильных устройствах
- Соответствие Angular best practices

## Риски и их митигация

### Риск 1: Нарушение существующей функциональности
**Митигация**: Пошаговая замена с тщательным тестированием каждого этапа

### Риск 2: Несовместимость с существующими стилями
**Митигация**: Использование тех же CSS классов и BEM структуры

### Риск 3: Производительность
**Митигация**: Использование OnPush и signals, профилирование производительности

### Риск 4: Сложность тестирования
**Митигация**: Создание helpers для тестирования, использование existing patterns

## Timeline

### Week 1: Foundation
- Этапы 1-2: Создание базового компонента и CVA интеграция

### Week 2: Features & Styling  
- Этапы 3-4: Расширенная функциональность и стилизация

### Week 3: Integration & Testing
- Этапы 5-6: Интеграция в проект и тестирование

## Заключение

Данный план обеспечивает создание переиспользуемого, типобезопасного и хорошо протестированного компонента для числовых полей, который:

1. Соответствует архитектуре FSD
2. Интегрируется с Angular Reactive Forms
3. Использует современные Angular паттерны (signals, standalone components)
4. Обеспечивает единообразный UX
5. Минимизирует дублирование кода
6. Упрощает создание новых форм в будущем

Компонент станет основой для всех числовых полей в приложении и обеспечит лучшую maintainability кодовой базы.
