# Input Fields Components Implementation Plan

## Обзор

Создание специализированных переиспользуемых компонентов для различных типов полей ввода в проекте. Компоненты будут основаны на существующем паттерне `SelectFieldComponent` и интегрированы в `shared/ui` слой согласно Feature-Sliced Design архитектуре.

## Текущая ситуация

### Анализ существующего кода

**Числовые поля (3 поля в basic-data-form):**
```html
<label tuiLabel class="basic-data-form__field-label">Age
  <tui-textfield>
    <input tuiInputNumber id="age" formControlName="age" placeholder="Enter age" [min]="10" [max]="120" />
  </tui-textfield>
</label>
```

**Текстовые поля (6 полей в login/register формах):**
```html
<label tuiLabel class="login__field-label">Email
  <tui-textfield>
    <input tuiTextfield formControlName="email" type="text" placeholder="Enter email" id="email" />
  </tui-textfield>
</label>
```

### Выявленные паттерны
1. Единообразная структура с `tuiLabel` и `tui-textfield`
2. Различные типы input: `text`, `password`, `number`
3. Общие атрибуты: `placeholder`, `formControlName`, `disabled`
4. Специфичные для числовых: `min`, `max`
5. Интеграция с Angular Reactive Forms

### Приоритеты
1. **Высокий приоритет**: Числовые поля (3 поля, сложная валидация)
2. **Средний приоритет**: Текстовые поля (6 полей, простая структура)
3. **Низкий приоритет**: Телефонные поля (пока не используются)

## Архитектурное решение

### Структура компонентов
```
src/shared/ui/
├── number-field/              # Специализированный компонент для числовых полей
│   ├── number-field.component.ts
│   ├── number-field.component.html
│   ├── number-field.component.scss
│   ├── number-field.component.spec.ts
│   └── index.ts
├── text-field/               # Специализированный компонент для текстовых полей
│   ├── text-field.component.ts
│   ├── text-field.component.html
│   ├── text-field.component.scss
│   ├── text-field.component.spec.ts
│   └── index.ts
└── phone-field/              # Специализированный компонент для телефонных полей (будущее)
    ├── phone-field.component.ts
    ├── phone-field.component.html
    ├── phone-field.component.scss
    ├── phone-field.component.spec.ts
    └── index.ts
```

### Интеграция в FSD архитектуру
- **Слой**: `shared/ui` (переиспользуемые UI компоненты)
- **Импорт**: Компоненты будут доступны через `@/shared`
- **Зависимости**: Только от Taiga UI и Angular Forms
- **Принцип**: Один компонент = одна ответственность

## Техническая спецификация

### 1. NumberFieldComponent

#### Интерфейс и типы
```typescript
// Типы для числовых полей
export type NumberFieldValue = number | null;

// Интерфейс для числовых ограничений
interface NumberConstraints {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}
```

#### Input параметры
```typescript
// Обязательные
readonly label = input.required<string>();
readonly placeholder = input.required<string>();

// Опциональные общие
readonly disabled = input<boolean>(false);
readonly required = input<boolean>(false);
readonly readonly = input<boolean>(false);
readonly suffix = input<string>(''); // единицы измерения (kg, cm)

// Для числовых полей
readonly min = input<number>();
readonly max = input<number>();
readonly step = input<number>(1);
readonly precision = input<number>(0);

// Для стилизации
readonly size = input<'s' | 'm' | 'l'>('m');
```

#### Output события
```typescript
readonly valueChange = output<number | null>();
```

#### ControlValueAccessor реализация
```typescript
implements ControlValueAccessor {
  writeValue(value: number | null): void
  registerOnChange(fn: (value: number | null) => void): void
  registerOnTouched(fn: () => void): void
  setDisabledState?(isDisabled: boolean): void
}
```

#### Template структура
```html
<label tuiLabel class="number-field__label" [for]="fieldId">
  <div class="number-field__label-content">
    {{ label() }}
    @if (required()) {<span class="number-field__required">*</span>}
    @if (suffix(); as suffixText) {<span class="number-field__suffix">({{ suffixText }})</span>}
  </div>
  <tui-textfield [tuiTextfieldSize]="size()">
    <input
      [id]="fieldId"
      tuiInputNumber
      [placeholder]="placeholder()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [value]="currentValue()"
      (input)="onValueChange($event)"
      (blur)="onTouched()"
    />
  </tui-textfield>
</label>
```

### 2. TextFieldComponent

#### Интерфейс и типы
```typescript
// Типы для текстовых полей
export type TextFieldValue = string | null;
export type TextFieldType = 'text' | 'email' | 'password' | 'url';

// Интерфейс для текстовых ограничений
interface TextConstraints {
  minlength?: number;
  maxlength?: number;
  pattern?: string;
}
```

#### Input параметры
```typescript
// Обязательные
readonly label = input.required<string>();
readonly placeholder = input.required<string>();

// Опциональные общие
readonly disabled = input<boolean>(false);
readonly required = input<boolean>(false);
readonly readonly = input<boolean>(false);

// Для текстовых полей
readonly type = input<TextFieldType>('text');
readonly minlength = input<number>();
readonly maxlength = input<number>();
readonly pattern = input<string>();

// Для стилизации
readonly size = input<'s' | 'm' | 'l'>('m');
```

#### Output события
```typescript
readonly valueChange = output<string | null>();
```

#### ControlValueAccessor реализация
```typescript
implements ControlValueAccessor {
  writeValue(value: string | null): void
  registerOnChange(fn: (value: string | null) => void): void
  registerOnTouched(fn: () => void): void
  setDisabledState?(isDisabled: boolean): void
}
```

#### Template структура
```html
<label tuiLabel class="text-field__label" [for]="fieldId">
  <div class="text-field__label-content">
    {{ label() }}
    @if (required()) {<span class="text-field__required">*</span>}
  </div>
  <tui-textfield [tuiTextfieldSize]="size()">
    <input
      [id]="fieldId"
      tuiTextfield
      [type]="type()"
      [placeholder]="placeholder()"
      [minlength]="minlength()"
      [maxlength]="maxlength()"
      [pattern]="pattern()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [value]="currentValue()"
      (input)="onValueChange($event)"
      (blur)="onTouched()"
    />
  </tui-textfield>
</label>
```

## Пошаговый план реализации

### Этап 1: NumberFieldComponent (Приоритет 1)
**Цель**: Создать специализированный компонент для числовых полей

**Задачи**:
1. Создать файловую структуру `src/shared/ui/number-field/`
2. Реализовать TypeScript класс с правильным ControlValueAccessor
3. Создать HTML template с `tuiInputNumber`
4. Добавить стили в соответствии с существующим паттерном
5. Создать unit тесты
6. Экспортировать компонент через `index.ts`

**Критерии готовности**:
- Компонент работает с `formControlName`
- Корректная обработка `min`, `max`, `step`, `precision`
- Поддержка `suffix` для единиц измерения
- Покрытие тестами минимум 80%

### Этап 2: Интеграция NumberFieldComponent
**Цель**: Заменить числовые поля в basic-data-form

**Задачи**:
1. Обновить экспорты в `shared/index.ts`
2. Заменить 3 числовых поля в `basic-data-form.component.html`:
   - Age (min: 10, max: 120)
   - Height (min: 100, max: 250, suffix: 'cm')
   - Weight (min: 30, max: 300, suffix: 'kg')
3. Обновить импорты в `basic-data-form.component.ts`
4. Протестировать интеграцию
5. Проверить, что форма работает корректно

**Критерии готовности**:
- Все числовые поля заменены на `NumberFieldComponent`
- Форма работает без регрессий
- Валидация работает корректно
- Автосохранение формы работает

### Этап 3: TextFieldComponent (Приоритет 2)
**Цель**: Создать специализированный компонент для текстовых полей

**Задачи**:
1. Создать файловую структуру `src/shared/ui/text-field/`
2. Реализовать TypeScript класс с поддержкой разных типов
3. Создать HTML template с `tuiTextfield`
4. Добавить стили
5. Создать unit тесты
6. Экспортировать компонент

**Критерии готовности**:
- Поддержка типов: `text`, `email`, `password`, `url`
- Корректная работа с `minlength`, `maxlength`, `pattern`
- Покрытие тестами минимум 80%

### Этап 4: Интеграция TextFieldComponent (Опционально)
**Цель**: Заменить текстовые поля в login/register формах

**Задачи**:
1. Обновить экспорты в `shared/index.ts`
2. Заменить текстовые поля в `login.component.html`
3. Заменить текстовые поля в `register.component.html`
4. Протестировать интеграцию
5. Проверить работу форм

**Критерии готовности**:
- Текстовые поля заменены на `TextFieldComponent`
- Формы работают без регрессий
- Валидация работает корректно

### Этап 5: PhoneFieldComponent (Будущее)
**Цель**: Создать компонент для телефонных полей при необходимости

**Задачи**:
1. Создать компонент с `tuiInputPhone`
2. Добавить поддержку различных форматов телефонов
3. Интегрировать при появлении потребности

## Детали реализации

### Imports и Dependencies

#### NumberFieldComponent
```typescript
import { ChangeDetectionStrategy, Component, input, output, signal, computed, inject } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber } from '@taiga-ui/kit';
import type { TuiSizeS, TuiSizeM, TuiSizeL } from '@taiga-ui/core';
```

#### TextFieldComponent
```typescript
import { ChangeDetectionStrategy, Component, input, output, signal, computed, inject } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { TuiTextfield } from '@taiga-ui/core';
import { TuiInput } from '@taiga-ui/kit';
import type { TuiSizeS, TuiSizeM, TuiSizeL } from '@taiga-ui/core';
```

### Provider конфигурация
```typescript
providers: [
  {
    provide: NG_VALUE_ACCESSOR,
    useExisting: NumberFieldComponent, // или TextFieldComponent
    multi: true,
  },
]
```

### Signals архитектура

#### NumberFieldComponent
```typescript
private readonly internalValue = signal<number | null>(null);
private readonly isTouched = signal<boolean>(false);

readonly currentValue = computed(() => this.internalValue());

private _onChange = (value: number | null): void => {
  void value;
};
private _onTouched = (): void => {};

onValueChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const value = target.value === '' ? null : Number(target.value);
  this.internalValue.set(value);
  this._onChange(value);
}

onTouched(): void {
  this.isTouched.set(true);
  this._onTouched();
}
```

#### TextFieldComponent
```typescript
private readonly internalValue = signal<string | null>(null);
private readonly isTouched = signal<boolean>(false);

readonly currentValue = computed(() => this.internalValue());

private _onChange = (value: string | null): void => {
  void value;
};
private _onTouched = (): void => {};

onValueChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const value = target.value === '' ? null : target.value;
  this.internalValue.set(value);
  this._onChange(value);
}

onTouched(): void {
  this.isTouched.set(true);
  this._onTouched();
}
```

## Примеры использования

### NumberFieldComponent
```html
<!-- Возраст -->
<app-number-field
  label="Age"
  placeholder="Enter age"
  [min]="10"
  [max]="120"
  formControlName="age"
/>

<!-- Рост с единицами измерения -->
<app-number-field
  label="Height"
  placeholder="Enter height"
  [min]="100"
  [max]="250"
  suffix="cm"
  formControlName="height"
/>

<!-- Вес с единицами измерения -->
<app-number-field
  label="Weight"
  placeholder="Enter weight"
  [min]="30"
  [max]="300"
  suffix="kg"
  formControlName="weight"
/>

<!-- Десятичные числа -->
<app-number-field
  label="Body Fat Percentage"
  placeholder="Enter percentage"
  [min]="5"
  [max]="50"
  [precision]="1"
  [step]="0.1"
  suffix="%"
  formControlName="bodyFat"
/>
```

### TextFieldComponent
```html
<!-- Email -->
<app-text-field
  type="email"
  label="Email"
  placeholder="Enter email"
  [required]="true"
  formControlName="email"
/>

<!-- Пароль -->
<app-text-field
  type="password"
  label="Password"
  placeholder="Enter password"
  [minlength]="8"
  [maxlength]="128"
  [required]="true"
  formControlName="password"
/>

<!-- Обычный текст -->
<app-text-field
  type="text"
  label="Full Name"
  placeholder="Enter your full name"
  [minlength]="2"
  [maxlength]="50"
  [required]="true"
  formControlName="fullName"
/>
```

## Рефакторинг существующего кода

### 1. basic-data-form.component.html
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
  <app-number-field
    label="Age"
    placeholder="Enter age"
    [min]="10"
    [max]="120"
    formControlName="age"
  />
</div>
```

### 2. basic-data-form.component.ts
```typescript
// Добавить импорт
import { NumberFieldComponent } from '@/shared';

// Обновить imports
imports: [
  ReactiveFormsModule,
  TuiButton,
  TuiInputNumber, // Убрать после замены всех полей
  TuiTextfield,   // Убрать после замены всех полей
  NumberFieldComponent, // Добавить
  SelectFieldComponent,
  SectionBlockComponent,
  FormAutosaveDirective,
],
```

## Тестирование

### Unit тесты для NumberFieldComponent
```typescript
describe('NumberFieldComponent', () => {
  describe('Component Creation', () => {
    it('should create component with required inputs');
    it('should generate unique field ID');
  });

  describe('Value Handling', () => {
    it('should emit valueChange when value changes');
    it('should handle null values correctly');
    it('should convert string input to number');
    it('should respect min/max constraints');
  });

  describe('ControlValueAccessor', () => {
    it('should implement writeValue correctly');
    it('should call onChange when value changes');
    it('should handle disabled state');
    it('should call onTouched on blur');
  });

  describe('Form Integration', () => {
    it('should work with reactive forms');
    it('should maintain form validation state');
    it('should preserve existing form behavior');
  });

  describe('Number Constraints', () => {
    it('should respect min constraint');
    it('should respect max constraint');
    it('should respect step constraint');
    it('should respect precision constraint');
  });
});
```

### Unit тесты для TextFieldComponent
```typescript
describe('TextFieldComponent', () => {
  describe('Component Creation', () => {
    it('should create component with required inputs');
    it('should generate unique field ID');
  });

  describe('Value Handling', () => {
    it('should emit valueChange when value changes');
    it('should handle null values correctly');
    it('should handle string values correctly');
  });

  describe('ControlValueAccessor', () => {
    it('should implement writeValue correctly');
    it('should call onChange when value changes');
    it('should handle disabled state');
    it('should call onTouched on blur');
  });

  describe('Field Types', () => {
    it('should support text type');
    it('should support email type');
    it('should support password type');
    it('should support url type');
  });

  describe('Text Constraints', () => {
    it('should respect minlength constraint');
    it('should respect maxlength constraint');
    it('should respect pattern constraint');
  });
});
```

### Integration тесты
```typescript
describe('Input Fields Form Integration', () => {
  it('should integrate NumberFieldComponent with basic-data-form correctly');
  it('should maintain form validation state');
  it('should preserve existing form behavior');
  it('should work with form autosave');
});
```

## Критерии качества

### Производительность
- Использование OnPush change detection
- Минимальное количество re-renders
- Efficient signal usage
- Правильная типизация для избежания лишних вычислений

### Доступность (A11y)
- Корректные ARIA атрибуты
- Уникальные ID для полей
- Поддержка клавиатурной навигации
- Семантически правильная разметка

### Тестирование
- Покрытие тестами минимум 80%
- Тесты для всех публичных методов
- Тесты интеграции с формами
- Тесты для всех типов полей

### Совместимость
- Работа во всех поддерживаемых браузерах
- Корректная работа на мобильных устройствах
- Соответствие Angular best practices
- Соответствие Taiga UI guidelines

## Риски и их митигация

### Риск 1: Нарушение существующей функциональности
**Митигация**: Пошаговая замена с тщательным тестированием каждого этапа

### Риск 2: Несовместимость с существующими стилями
**Митигация**: Использование тех же CSS классов и BEM структуры как в SelectFieldComponent

### Риск 3: Проблемы с типизацией
**Митигация**: Строгая типизация TypeScript, тестирование с различными типами данных

### Риск 4: Производительность
**Митигация**: Использование OnPush и signals, профилирование производительности

## Timeline

### Week 1: NumberFieldComponent
- Создание NumberFieldComponent
- Unit тесты
- Интеграция в basic-data-form

### Week 2: TextFieldComponent (Опционально)
- Создание TextFieldComponent
- Unit тесты
- Интеграция в login/register формы

### Week 3: Testing & Documentation
- Integration тесты
- Документация
- Финальное тестирование

## Заключение

Данный план обеспечивает создание специализированных, типобезопасных и хорошо протестированных компонентов для полей ввода, которые:

1. Соответствуют архитектуре FSD
2. Интегрируются с Angular Reactive Forms
3. Используют современные Angular паттерны (signals, standalone components)
4. Обеспечивают единообразный UX
5. Минимизируют дублирование кода
6. Упрощают создание новых форм в будущем

**Приоритет**: Начать с NumberFieldComponent как наиболее критичного компонента, затем расширять функциональность по мере необходимости.
