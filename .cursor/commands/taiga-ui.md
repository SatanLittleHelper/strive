Создай компонент с Taiga UI согласно правилам проекта:

**Требования:**

- Используй современный синтаксис Taiga UI
- Используй директивы на стандартных HTML элементах
- Используй tuiItemsHandlersProvider для селектов с объектами
- Используй computed signals для оптимизации
- Всегда добавляй атрибут `new` в `tui-data-list-wrapper`
- Используй BEM методологию для CSS классов

**Правила импортов:**

```typescript
// ✅ Правильные импорты
import { TuiButton } from '@taiga-ui/core';
import { TuiInputModule, TuiSelectModule } from '@taiga-ui/kit';

// ❌ Неправильные импорты
import { TuiSelect } from '@taiga-ui/core';
```

**Современный Select с объектами:**

```typescript
@Component({...})
export class ExampleComponent {
  // Computed signal для опций с displayText
  protected readonly options = computed(() =>
    generateSelectOptions(SourceObject).map(option => ({
      ...option,
      displayText: stringifySelectOptionByValue(generateSelectOptions(SourceObject), option.value)
    }))
  );

  // Функция для [stringify] на tui-textfield
  protected readonly stringifyOption = (item: string): string =>
    stringifySelectOptionByValue(generateSelectOptions(SourceObject), item);
}
```

```html
<!-- Современный template -->
<tui-textfield tuiChevron [stringify]="stringifyOption">
  <input tuiSelect formControlName="fieldName" />
  <tui-data-list *tuiTextfieldDropdown>
    @for (item of options(); track item.value) {
      <button new tuiOption type="button" [value]="item.value">
        {{ item.displayText }}
      </button>
    }
  </tui-data-list>
</tui-textfield>
```

**TuiInputNumber:**

```html
<!-- ✅ Правильно - директива на input + tui-textfield -->
<tui-textfield>
  <input tuiInputNumber formControlName="fieldName" />
</tui-textfield>

<!-- ❌ Неправильно - компонент -->
<tui-input-number formControlName="fieldName" />
```

**TuiButton:**

```html
<!-- ✅ Правильно - директива на button -->
<button tuiButton type="button" (click)="onClick()">
  Button Text
</button>

<!-- ❌ Неправильно - компонент -->
<tui-button (click)="onClick()">Button Text</tui-button>
```

**Провайдеры для селектов:**

```typescript
@Component({
  providers: [
    tuiItemsHandlersProvider({
      stringify: (item: SelectOption) => item.displayText,
    }),
  ],
})
export class ComponentWithSelect {
  // ...
}
```

**Шаги:**

1. Определи какие Taiga UI компоненты нужны
2. Импортируй правильные модули
3. Используй директивы на HTML элементах
4. Добавь провайдеры для селектов с объектами
5. Используй computed signals для оптимизации
6. Добавь BEM классы для стилизации

**Примеры компонентов:**

- Форма с селектом: `src/features/calorie-calculation/ui/basic-data-form/`
- Кнопка: `src/shared/ui/back-layout/back-layout.component.html`
- Поле ввода: `src/features/calorie-calculation/ui/activity-goal-form/`

Создай компонент с Taiga UI и покажи результат.