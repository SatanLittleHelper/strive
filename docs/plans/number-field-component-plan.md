# NumberFieldComponent Implementation Plan

## Обзор

Создание специализированного компонента `NumberFieldComponent` для унификации числовых полей в проекте. Компонент будет основан на существующем паттерне `SelectFieldComponent` и интегрирован в `shared/ui` слой согласно Feature-Sliced Design архитектуре.

## Проблема

В `basic-data-form.component.html` повторяется один и тот же паттерн для числовых полей:

```html
<label tuiLabel class="basic-data-form__field-label">Age
  <tui-textfield>
    <input tuiInputNumber id="age" formControlName="age" placeholder="Enter age" [min]="10" [max]="120" />
  </tui-textfield>
</label>
```

**Поля для замены:**
- Age (min: 10, max: 120)
- Height (min: 100, max: 250, suffix: 'cm')
- Weight (min: 30, max: 300, suffix: 'kg')

## Техническая спецификация

### Структура компонента
```
src/shared/ui/number-field/
├── number-field.component.ts
├── number-field.component.html
├── number-field.component.scss
├── number-field.component.spec.ts
└── index.ts
```

### Input параметры
```typescript
// Обязательные
readonly label = input.required<string>();
readonly placeholder = input.required<string>();

// Опциональные
readonly disabled = input<boolean>(false);
readonly required = input<boolean>(false);
readonly readonly = input<boolean>(false);
readonly suffix = input<string>(''); // единицы измерения (kg, cm)
readonly min = input<number>();
readonly max = input<number>();
readonly step = input<number>(1);
readonly precision = input<number>(0);
readonly size = input<'s' | 'm' | 'l'>('m');
```

### Output события
```typescript
readonly valueChange = output<number | null>();
```

### ControlValueAccessor реализация
```typescript
implements ControlValueAccessor {
  writeValue(value: number | null): void
  registerOnChange(fn: (value: number | null) => void): void
  registerOnTouched(fn: () => void): void
  setDisabledState?(isDisabled: boolean): void
}
```

### Template структура
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

## Пошаговый план реализации

### Этап 1: Создание компонента
**Задачи**:
1. Создать файловую структуру
2. Реализовать TypeScript класс с ControlValueAccessor
3. Создать HTML template
4. Добавить стили
5. Создать unit тесты
6. Экспортировать через index.ts

### Этап 2: Интеграция
**Задачи**:
1. Обновить экспорты в `shared/index.ts`
2. Заменить 3 числовых поля в `basic-data-form.component.html`
3. Обновить импорты в `basic-data-form.component.ts`
4. Протестировать интеграцию

## Примеры использования

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
```

## Критерии готовности

- [ ] Компонент работает с `formControlName`
- [ ] Корректная обработка `min`, `max`, `step`, `precision`
- [ ] Поддержка `suffix` для единиц измерения
- [ ] Покрытие тестами минимум 80%
- [ ] Все числовые поля в basic-data-form заменены
- [ ] Форма работает без регрессий
- [ ] Валидация работает корректно
- [ ] Автосохранение формы работает

## Timeline

**Week 1**: Создание компонента и интеграция
- День 1-2: Создание NumberFieldComponent
- День 3-4: Unit тесты
- День 5: Интеграция в basic-data-form

**Результат**: Все числовые поля унифицированы, код стал более maintainable.
