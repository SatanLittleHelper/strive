# План реализации директивы автосохранения форм

## Метаданные плана
- Ветка: feature/form-autosave-directive
- Имя файла: docs/plans/feature-form-autosave-directive.md
- Дата: 2025-09-11
- Статус: draft

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
formAutosaveLoaded: EventEmitter<Record<string, unknown>>    // Событие загрузки данных из localStorage
formAutosaveSaved: EventEmitter<Record<string, unknown>>     // Событие сохранения данных
formAutosaveCleared: EventEmitter<void>                      // Событие очистки данных
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
private saveToStorage(key: string, data: Record<string, unknown>): void
private loadFromStorage(key: string): Record<string, unknown> | null
private clearFromStorage(key: string): void
```
Примечание: допускается вынесение работы с хранилищем в отдельный сервис уровня `shared/services` с `providedIn: 'root'`.

#### 3. Debounce механизм
Подписка на `valueChanges` с использованием `debounceTime` внутри RxJS-пайплайна, без хранения оператора в поле.

#### 4. Form value observer
```typescript
private setupFormValueObserver(): void {
	// Отслеживание изменений в форме с авто-отпиской
}
```

#### 5. Submit handler
```typescript
private handleFormSubmit(): void {
	// Очистка данных при сабмите
}
```

### Используемые Angular API
- `@Directive` с селектором в kebab-case: `[app-form-autosave]`
- `host` объект в декораторе для обработки событий (например, `(submit)`)
- `input()` и `output()` функции
- `inject()` для внедрения зависимостей
- `takeUntilDestroyed()` для авто-отписки от RxJS-подписок
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
- **Авто-отписка** через `takeUntilDestroyed()`
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
- Использовать `configureZonelessTestingModule()`
- Запуск только в headless режиме (`npm run test:ci`)
- Проверка с реальными формами в приложении (критические сценарии)

## 9. Интеграция в проект

### Обновление публичного API
```typescript
// src/shared/index.ts
export * from './lib/directives/form-autosave';
```

### Использование в существующих формах

#### BasicDataFormComponent
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" app-form-autosave>
```

#### ActivityGoalFormComponent
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" app-form-autosave>
```

### Миграция существующих форм
1. Добавить директиву к существующим формам
2. Протестировать автосохранение
3. Добавить обработчики событий при необходимости

## 10. Документация

### Документация в markdown
- Примеры использования (базовый/расширенный)
- Описание всех inputs/outputs и сценариев
- Troubleshooting guide

## 11. Итерации и этапы реализации

### Итерация 1 (MVP)
- [ ] Файловая структура и базовая директива (inputs/outputs)
- [ ] Генерация хеша формы
- [ ] Подписка на `valueChanges` с `debounceTime` и сохранение

### Итерация 2
- [ ] Безопасные операции со storage и обработка ошибок
- [ ] Загрузка сохранённых данных при инициализации
- [ ] Очистка данных при сабмите

### Итерация 3
- [ ] Unit тесты и integration тесты (критические сценарии)
- [ ] Обновление публичного API экспорта
- [ ] Документация в markdown

## 12. Критерии готовности

### Функциональные требования
- [ ] Генерация уникального хеша для каждой формы
- [ ] Автосохранение при изменениях
- [ ] Автозагрузка при инициализации
- [ ] Очистка при сабмите
- [ ] Обработка ошибок localStorage

### Нефункциональные требования
- [ ] Производительность: время сохранения < 5мс
- [ ] Покрытие тестами: 80% statements, 70% branches, 80% functions, 80% lines
- [ ] Документация (markdown)
- [ ] Совместимость с существующими формами

### Качество кода
- [ ] Соответствие Angular best practices (standalone, signals, host bindings)
- [ ] Соответствие FSD архитектуре и публичным API
- [ ] ESLint без ошибок, успешный build
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
