# Form Autosave Directive

Директива для автоматического сохранения содержимого форм в localStorage с возможностью восстановления данных при перезагрузке страницы.

## Описание

`FormAutosaveDirective` автоматически сохраняет данные форм в localStorage при изменениях и восстанавливает их при инициализации. Данные очищаются при успешном сабмите формы.

## Основные возможности

- **Генерация уникального хеша** для каждой формы на основе её структуры
- **Автосохранение** данных формы в localStorage при изменениях
- **Автозагрузка** данных из localStorage при инициализации
- **Очистка** данных при сабмите формы
- **Безопасная работа** с localStorage с обработкой ошибок
- **Debounce механизм** для оптимизации производительности

## Использование

### Базовое использование

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" app-form-autosave>
  <!-- поля формы -->
</form>
```

### Расширенное использование

```html
<form 
  [formGroup]="form" 
  (ngSubmit)="onSubmit()" 
  app-form-autosave
  [formAutosaveKey]="'custom-form-key'"
  [formAutosaveDebounce]="1000"
  [formAutosaveEnabled]="true"
  (formAutosaveLoaded)="onDataLoaded($event)"
  (formAutosaveSaved)="onDataSaved($event)"
  (formAutosaveCleared)="onDataCleared()"
>
  <!-- поля формы -->
</form>
```

## API

### Inputs

| Input | Тип | По умолчанию | Описание |
|-------|-----|--------------|----------|
| `formAutosaveKey` | `string` | `undefined` | Опциональный ключ для переопределения автоматически генерируемого хеша |
| `formAutosaveEnabled` | `boolean` | `true` | Включение/отключение автосохранения |
| `formAutosaveDebounce` | `number` | `500` | Задержка перед сохранением в миллисекундах |

### Outputs

| Output | Тип | Описание |
|--------|-----|----------|
| `formAutosaveLoaded` | `EventEmitter<Record<string, unknown>>` | Событие загрузки данных из localStorage |
| `formAutosaveSaved` | `EventEmitter<Record<string, unknown>>` | Событие сохранения данных в localStorage |
| `formAutosaveCleared` | `EventEmitter<void>` | Событие очистки данных из localStorage |

## Примеры интеграции

### В компоненте

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormAutosaveDirective } from '@/shared';

@Component({
  selector: 'app-example-form',
  imports: [ReactiveFormsModule, FormAutosaveDirective],
  template: `
    <form 
      [formGroup]="form" 
      (ngSubmit)="onSubmit()" 
      app-form-autosave
      [formAutosaveKey]="'example-form'"
      (formAutosaveLoaded)="onDataLoaded($event)"
      (formAutosaveSaved)="onDataSaved($event)"
      (formAutosaveCleared)="onDataCleared()"
    >
      <input formControlName="name" placeholder="Name">
      <input formControlName="email" placeholder="Email">
      <button type="submit">Submit</button>
    </form>
  `
})
export class ExampleFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: [''],
      email: ['']
    });
  }

  onDataLoaded(data: Record<string, unknown>): void {
    console.log('Data loaded from autosave:', data);
  }

  onDataSaved(data: Record<string, unknown>): void {
    console.log('Data saved to autosave:', data);
  }

  onDataCleared(): void {
    console.log('Data cleared from autosave');
  }

  onSubmit(): void {
    if (this.form.valid) {
      // Обработка сабмита
      // Данные автоматически очистятся из localStorage
    }
  }
}
```

## Алгоритм работы

### Генерация хеша

Уникальный хеш формируется на основе:
- Структуры FormGroup (названия полей и их типы)
- Валидаторов полей
- Опционального пользовательского ключа

### Жизненный цикл

1. **Инициализация**: Директива генерирует хеш формы и загружает сохранённые данные
2. **Отслеживание изменений**: При изменении значений формы данные сохраняются с debounce
3. **Сабмит**: При успешном сабмите данные очищаются из localStorage

### Безопасность

- Все операции с localStorage обёрнуты в try-catch
- При ошибках localStorage работа продолжается с логированием в консоль
- Graceful degradation при недоступности localStorage

## Производительность

- **Debounce механизм** предотвращает частые обращения к localStorage
- **Автоматическая отписка** через `takeUntilDestroyed()` предотвращает утечки памяти
- **Минимальные обращения** к localStorage только при необходимости

## Ограничения

- Работает только с `FormGroup` из Angular Reactive Forms
- Данные сохраняются только в localStorage (не в sessionStorage)
- Максимальный размер localStorage ограничен браузером (~5-10MB)

## Troubleshooting

### Директива не сохраняет данные

1. Убедитесь, что форма использует `FormGroup`
2. Проверьте, что `formAutosaveEnabled` не установлен в `false`
3. Проверьте консоль на наличие ошибок localStorage

### Данные не загружаются

1. Проверьте, что хеш формы не изменился
2. Убедитесь, что данные не были очищены вручную
3. Проверьте доступность localStorage в браузере

### Производительность

1. Увеличьте `formAutosaveDebounce` для форм с частыми изменениями
2. Используйте `formAutosaveEnabled="false"` для временного отключения
3. Очищайте старые данные в localStorage периодически

## Интеграция в проект

Директива уже интегрирована в следующие формы:

- `BasicDataFormComponent` - форма базовых данных калькулятора калорий
- `ActivityGoalFormComponent` - форма уровня активности и цели

### Добавление в новые формы

1. Импортируйте `FormAutosaveDirective` в компонент
2. Добавьте директиву в imports массив
3. Добавьте `app-form-autosave` в HTML шаблон формы
4. При необходимости добавьте обработчики событий

```typescript
// В компоненте
import { FormAutosaveDirective } from '@/shared';

@Component({
  imports: [FormAutosaveDirective, /* другие импорты */],
  // ...
})
```

```html
<!-- В шаблоне -->
<form [formGroup]="form" (ngSubmit)="onSubmit()" app-form-autosave>
  <!-- поля формы -->
</form>
```
