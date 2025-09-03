# План реализации директивы автосохранения форм

## Описание фичи

Директива для автоматического сохранения содержимого форм в localStorage с возможностью восстановления данных при перезагрузке страницы.

## Основные требования

- Генерация уникального хеша для каждой формы
- Автосохранение данных при изменениях в форме
- Автозагрузка данных из localStorage при инициализации
- Очистка данных при сабмите формы

## 1. Структура директивы

### Расположение
```
src/shared/lib/directives/form-autosave/
├── form-autosave.directive.ts
├── form-autosave.directive.spec.ts
└── index.ts
```

### Файлы
- `form-autosave.directive.ts` - основная директива
- `form-autosave.directive.spec.ts` - unit тесты
- `index.ts` - публичный API экспорт

## 2. Функциональность директивы

### Основные возможности
- **Генерация уникального хеша** для формы на основе её структуры
- **Автосохранение** данных формы в localStorage при изменениях
- **Автозагрузка** данных из localStorage при инициализации
- **Очистка** данных при сабмите формы

### Входные параметры (inputs)
```typescript
formAutosaveKey?: string           // Опциональный ключ для переопределения хеша
formAutosaveEnabled: boolean       // Включение/отключение автосохранения (по умолчанию: true)
formAutosaveDebounce: number       // Задержка перед сохранением в мс (по умолчанию: 500)
```

### Выходные события (outputs)
```typescript
formAutosaveLoaded: EventEmitter<any>    // Событие загрузки данных из localStorage
formAutosaveSaved: EventEmitter<any>     // Событие сохранения данных
formAutosaveCleared: EventEmitter<void>  // Событие очистки данных
```

## 3. Алгоритм генерации хеша

### Уникальный хеш формируется на основе:
- Селектора формы (если есть)
- Структуры FormGroup (названия полей и их типы)
- Валидаторов полей
- Опционального пользовательского ключа

### Пример генерации хеша:
```typescript
// Для формы с полями: gender, age, height, weight
// Хеш: "form_abc123def456"

// Для формы с пользовательским ключом
// Хеш: "custom_calorie_calculator_basic"
```

## 4. Интеграция с существующими формами

### Базовое использование
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" appFormAutosave>
  <!-- поля формы -->
</form>
```

### Расширенное использование
```html
<form 
  [formGroup]="form" 
  (ngSubmit)="onSubmit()" 
  appFormAutosave
  [formAutosaveKey]="'calorie-calculator-basic'"
  [formAutosaveDebounce]="1000"
  [formAutosaveEnabled]="true"
  (formAutosaveLoaded)="onDataLoaded($event)"
  (formAutosaveSaved)="onDataSaved($event)"
  (formAutosaveCleared)="onDataCleared()"
>
  <!-- поля формы -->
</form>
```

## 5. Техническая реализация

### Ключевые компоненты

#### 1. Хеш-генератор
```typescript
private generateFormHash(): string {
  // Логика генерации уникального хеша на основе структуры формы
}
```

#### 2. Storage сервис
```typescript
private saveToStorage(key: string, data: any): void
private loadFromStorage(key: string): any | null
private clearFromStorage(key: string): void
```

#### 3. Debounce механизм
```typescript
private debounceSave = debounceTime(this.formAutosaveDebounce())
```

#### 4. Form value observer
```typescript
private setupFormValueObserver(): void {
  // Отслеживание изменений в форме
}
```

#### 5. Submit handler
```typescript
private handleFormSubmit(): void {
  // Очистка данных при сабмите
}
```

### Используемые Angular API
- `@Directive` с `standalone: true`
- `input()` и `output()` функции
- `inject()` для внедрения зависимостей
- `OnInit`, `OnDestroy` lifecycle hooks
- `FormGroup` и `ReactiveFormsModule`

## 6. Обработка ошибок

### Безопасная работа с localStorage
```typescript
private safeLocalStorageOperation<T>(operation: () => T): T | null {
  try {
    return operation();
  } catch (error) {
    console.warn('Form autosave localStorage error:', error);
    return null;
  }
}
```

### Валидация входных данных
- Проверка корректности debounce значения
- Валидация пользовательского ключа
- Проверка доступности localStorage

### Graceful degradation
- Продолжение работы при недоступности localStorage
- Логирование ошибок в консоль
- Fallback поведение

## 7. Производительность

### Оптимизации
- **Debounce** для предотвращения частых сохранений
- **OnPush** change detection strategy
- **Отписка от подписок** в `ngOnDestroy`
- **Минимальное количество обращений** к localStorage

### Метрики производительности
- Время генерации хеша < 1мс
- Время сохранения в localStorage < 5мс
- Память: не более 1MB на форму

## 8. Тестирование

### Unit тесты

#### Тестирование генерации хеша
```typescript
describe('Hash Generation', () => {
  it('should generate same hash for same form structure')
  it('should generate different hash for different form structures')
  it('should respect custom key when provided')
})
```

#### Тестирование сохранения/загрузки
```typescript
describe('Storage Operations', () => {
  it('should save form data to localStorage')
  it('should load form data from localStorage')
  it('should clear data on form submit')
  it('should handle localStorage errors gracefully')
})
```

#### Тестирование debounce
```typescript
describe('Debounce Mechanism', () => {
  it('should debounce save operations')
  it('should respect custom debounce time')
})
```

### Integration тесты
- Тестирование с реальными формами в приложении
- Проверка работы с `BasicDataFormComponent`
- Проверка работы с `ActivityGoalFormComponent`

## 9. Интеграция в проект

### Обновление публичного API
```typescript
// src/shared/index.ts
export * from './lib/directives/form-autosave';
```

### Использование в существующих формах

#### BasicDataFormComponent
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" appFormAutosave>
```

#### ActivityGoalFormComponent
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" appFormAutosave>
```

### Миграция существующих форм
1. Добавить директиву к существующим формам
2. Протестировать автосохранение
3. Добавить обработчики событий при необходимости

## 10. Документация

### JSDoc комментарии
```typescript
/**
 * Директива для автоматического сохранения данных формы в localStorage
 * 
 * @example
 * ```html
 * <form [formGroup]="form" appFormAutosave>
 *   <!-- поля формы -->
 * </form>
 * ```
 */
@Directive({
  selector: '[appFormAutosave]',
  standalone: true,
})
export class FormAutosaveDirective {
  // ...
}
```

### Примеры использования
- Базовое использование
- Расширенная конфигурация
- Обработка событий
- Интеграция с существующими формами

### API документация
- Описание всех inputs/outputs
- Примеры конфигурации
- Troubleshooting guide

## 11. Этапы реализации

### Этап 1: Базовая структура
- [ ] Создание файловой структуры
- [ ] Базовая директива с inputs/outputs
- [ ] Генерация хеша формы

### Этап 2: Storage функциональность
- [ ] Методы работы с localStorage
- [ ] Обработка ошибок
- [ ] Безопасные операции

### Этап 3: Form integration
- [ ] Отслеживание изменений формы
- [ ] Debounce механизм
- [ ] Обработка сабмита

### Этап 4: Тестирование
- [ ] Unit тесты
- [ ] Integration тесты
- [ ] Performance тесты

### Этап 5: Интеграция
- [ ] Обновление публичного API
- [ ] Интеграция с существующими формами
- [ ] Документация

## 12. Критерии готовности

### Функциональные требования
- [ ] Генерация уникального хеша для каждой формы
- [ ] Автосохранение при изменениях
- [ ] Автозагрузка при инициализации
- [ ] Очистка при сабмите
- [ ] Обработка ошибок localStorage

### Нефункциональные требования
- [ ] Производительность: время сохранения < 5мс
- [ ] Покрытие тестами > 90%
- [ ] Документация API
- [ ] Совместимость с существующими формами

### Качество кода
- [ ] Соответствие Angular best practices
- [ ] Соответствие FSD архитектуре
- [ ] ESLint без ошибок
- [ ] TypeScript strict mode

## 13. Риски и митигация

### Риски
1. **Производительность** - частые обращения к localStorage
   - *Митигация*: debounce механизм, оптимизация алгоритма хеширования

2. **Совместимость** - работа с разными типами форм
   - *Митигация*: тщательное тестирование, graceful degradation

3. **Безопасность** - хранение чувствительных данных
   - *Митигация*: предупреждение в документации, опция отключения

4. **Размер localStorage** - превышение лимитов
   - *Митигация*: мониторинг размера, автоматическая очистка старых данных

## 14. Будущие улучшения

### Возможные расширения
- Поддержка sessionStorage
- Шифрование данных
- Синхронизация между вкладками
- Автоматическая очистка старых данных
- Метрики использования
- Интеграция с DevTools

### Мониторинг
- Логирование ошибок
- Метрики производительности
- Анализ использования
- Feedback от пользователей
