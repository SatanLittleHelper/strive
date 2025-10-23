# План миграции расчета калорий с фронтенда на бэкенд

## Обзор

Текущее приложение выполняет расчет калорий и макронутриентов на фронтенде с использованием формулы Mifflin-St Jeor. Необходимо полностью заменить фронтенд-логику на вызовы бэкенд API, который уже реализован и доступен по адресу `https://strive-api-zjtl.onrender.com`.

## Текущее состояние

### Фронтенд-расчеты (текущее)
- **Сервис**: `CalorieApiService` в `src/features/calorie-calculation/services/calorie-api.service.ts`
- **Логика**: Полная реализация формулы Mifflin-St Jeor на фронтенде
- **Хранение**: localStorage для сохранения результатов
- **Алгоритм**: 
  - BMR расчет по формуле Mifflin-St Jeor
  - TDEE = BMR × Activity Multiplier
  - Target Calories = TDEE × Goal Modifier
  - Макронутриенты: белки, жиры, углеводы

### Бэкенд API (доступный)
- **Base URL**: `https://strive-api-zjtl.onrender.com`
- **Эндпоинты**:
  - `POST /api/v1/calorie/calculate` - расчет калорий
  - `GET /api/v1/calorie/last` - получение дневной цели по калориям
- **Аутентификация**: JWT токен в заголовке Authorization
- **Алгоритм**: Тот же Mifflin-St Jeor, но на бэкенде

## Проблемы текущего подхода

1. **Дублирование логики**: Одинаковый алгоритм на фронте и бэке
2. **Небезопасность**: Логика расчетов доступна в клиентском коде
3. **Синхронизация**: Сложность поддержания одинаковой логики
4. **Производительность**: Тяжелые вычисления на клиенте
5. **Валидация**: Отсутствие серверной валидации данных
6. **Локальное хранение**: Данные не синхронизируются между устройствами

## Цели миграции

1. **Централизация логики**: Все расчеты на бэкенде
2. **Безопасность**: Защита алгоритмов от клиентского доступа
3. **Консистентность**: Единый источник истины для расчетов
4. **Производительность**: Освобождение клиента от вычислений
5. **Валидация**: Серверная валидация входных данных
6. **Персистентность**: Сохранение расчетов в базе данных
7. **Синхронизация**: Доступ к данным с любого устройства

## Детальный план миграции

### Этап 1: Подготовка инфраструктуры (1 час)

#### 1.1 Создание новых типов данных
- **Файл**: `src/features/calorie-calculation/models/api.types.ts`
- **Содержание**: Типы для API запросов и ответов
- **Типы**:
  ```typescript
  interface CalorieCalculationRequest {
    gender: "male" | "female";
    age: number;
    height: number;
    weight: number;
    activityLevel: string;
    goal: string;
  }

  interface CalorieCalculationResponse {
    bmr: number;
    tdee: number;
    targetCalories: number;
    macros: {
      protein: { grams: number; percentage: number };
      fat: { grams: number; percentage: number };
      carbs: { grams: number; percentage: number };
    };
  }

  interface DailyCalorieTargetResponse {
    id: string;
    user_id: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    activity_level: string;
    goal: string;
    bmr: number;
    tdee: number;
    target_calories: number;
    formula: string;
    protein_grams: number;
    protein_percentage: number;
    fat_grams: number;
    fat_percentage: number;
    carbs_grams: number;
    carbs_percentage: number;
    created_at: string;
    updated_at: string;
  }
  ```

#### 1.2 Обновление существующих типов
- **Файл**: `src/features/calorie-calculation/models/calorie-data.types.ts`
- **Изменения**:
  - Унификация типов с бэкенд API
  - Удаление дублирующих интерфейсов
  - Использование одинаковых форматов данных

### Этап 2: Полная замена сервисов (2-3 часа)

#### 2.1 Полная замена CalorieApiService
- **Файл**: `src/features/calorie-calculation/services/calorie-api.service.ts`
- **Изменения**:
  - **УДАЛИТЬ**: Всю фронтенд-логику расчетов
  - **УДАЛИТЬ**: localStorage логику
  - **ДОБАВИТЬ**: HTTP запросы к бэкенд API
  - **ДОБАВИТЬ**: Обработку ошибок API
  - **СОХРАНИТЬ**: Существующий интерфейс методов
  - **ИСПОЛЬЗОВАТЬ**: Одинаковые типы данных с бэкендом

#### 2.2 Обновление CalorieCalculatorService
- **Файл**: `src/features/calorie-calculation/services/calorie-calculator.service.ts`
- **Изменения**:
  - Адаптация к новому API
  - Удаление localStorage зависимостей
  - Обновление сигналов и состояний

### Этап 3: Тестирование сервисов (2-3 часа)

#### 3.1 Unit тесты для новых сервисов
- **Файлы**: 
  - `calorie-api.service.spec.ts` - полное переписывание
- **Покрытие**:
  - Успешные API вызовы
  - Обработка ошибок API
  - Валидация входных данных
  - Работа с одинаковыми типами данных

#### 3.2 Integration тесты
- **Файлы**: Обновление существующих integration тестов
- **Покрытие**:
  - Полный flow расчета калорий через API
  - Загрузка дневной цели по калориям
  - Обработка ошибок сети
  - Обработка ошибок аутентификации

### Этап 4: Очистка и оптимизация (1 час)

#### 4.1 Удаление устаревшего кода
- **Файлы для удаления**:
  - Вся фронтенд-логика расчетов из `calorie-api.service.ts`
  - Константы и утилиты расчетов
  - localStorage логику
  - Неиспользуемые типы и интерфейсы

#### 4.2 Оптимизация производительности
- **Изменения**:
  - Кэширование API ответов в памяти
  - Оптимизация HTTP запросов
  - Уменьшение размера бандла

#### 4.3 Обновление документации
- **Файлы**:
  - `CLAUDE.md` - обновление архитектуры
  - `docs/DEPLOYMENT.md` - обновление конфигурации

## Технические детали

### API Endpoints Mapping

| Функция | Текущий метод | Новый API endpoint |
|---------|---------------|-------------------|
| Расчет калорий | `calculateCalories()` | `POST /api/v1/calorie/calculate` |
| Получение дневной цели | `getCaloriesResult()` | `GET /api/v1/calorie/last` |

### Data Types

#### Единые типы данных (Frontend = Backend)
```typescript
// Общий формат для фронтенда и бэкенда
interface CalorieCalculationData {
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
}

interface CalorieResults {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: {
    protein: { grams: number; percentage: number };
    fat: { grams: number; percentage: number };
    carbs: { grams: number; percentage: number };
  };
}

interface DailyCalorieTarget {
  id: string;
  user_id: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity_level: string;
  goal: string;
  bmr: number;
  tdee: number;
  target_calories: number;
  formula: string;
  protein_grams: number;
  protein_percentage: number;
  fat_grams: number;
  fat_percentage: number;
  carbs_grams: number;
  carbs_percentage: number;
  created_at: string;
  updated_at: string;
}
```

### Error Handling

#### API Error Codes
- `400` - Validation Error
- `401` - Unauthorized
- `404` - Not Found (для getLastCalculation)
- `500` - Internal Server Error

#### Error Strategy
1. **Ошибка аутентификации** → Redirect на login
2. **Ошибка валидации** → Показать ошибки пользователю
3. **Сетевая ошибка** → Retry с exponential backoff
4. **API недоступен** → Показать сообщение пользователю

### Performance Considerations

#### Caching Strategy
- **API responses**: Кэширование в памяти на время сессии
- **User data**: Кэширование до следующего расчета
- **Нет localStorage**: Все данные только на бэкенде

#### Bundle Size Impact
- **Удаление**: ~3KB фронтенд-логики расчетов
- **Удаление**: ~1KB localStorage логики
- **Удаление**: ~0.5KB утилит маппинга данных
- **Добавление**: ~0.2KB унифицированных типов
- **Net impact**: -4.3KB размера бандла

## Риски и митигация

### Риски

1. **API недоступность**
   - **Митигация**: Показать сообщение пользователю о недоступности сервиса
   - **Мониторинг**: Health check endpoints

2. **Несовместимость данных**
   - **Митигация**: Тщательное тестирование маппинга
   - **Валидация**: Runtime проверки типов

3. **Производительность**
   - **Митигация**: Кэширование в памяти и оптимизация
   - **Мониторинг**: Performance metrics

4. **Пользовательский опыт**
   - **Митигация**: Graceful error handling
   - **Тестирование**: User acceptance testing

### Rollback Plan

1. **Быстрый откат**: Revert к предыдущей версии
2. **Данные**: Все данные на бэкенде, нет потери данных

## Критерии успеха

### Функциональные
- [ ] Все расчеты выполняются через API
- [ ] Данные сохраняются на бэкенде
- [ ] Пользовательский опыт не ухудшается
- [ ] Нет зависимости от localStorage

### Технические
- [ ] Покрытие тестами > 80%
- [ ] Размер бандла уменьшен на 3.5KB
- [ ] Производительность не ухудшилась
- [ ] Нет критических ошибок

### Бизнес
- [ ] Расчеты выполняются на сервере
- [ ] Данные синхронизируются между устройствами
- [ ] Логика защищена от клиентского доступа
- [ ] Готовность к масштабированию

## Временные рамки

- **Общее время**: 5-7 часов
- **Этап 1**: 1 час
- **Этап 2**: 2-3 часа  
- **Этап 3**: 2-3 часа
- **Этап 4**: 1 час

## Следующие шаги

1. **Подтверждение плана** с командой
2. **Создание feature branch** для миграции
3. **Начало реализации** с Этапа 1
4. **Итеративная разработка** с тестированием на каждом этапе
5. **Code review** перед merge
6. **Мониторинг** после деплоя

## Дополнительные соображения

### Мониторинг
- **API calls**: Количество и время выполнения
- **Error rates**: Процент ошибок по типам
- **User experience**: Метрики производительности

### Документация
- **API documentation**: Обновление внутренней документации
- **Migration guide**: Руководство для других команд
- **Troubleshooting**: Решение типичных проблем

### Будущие улучшения
- **Real-time updates**: WebSocket для обновлений
- **Batch calculations**: Массовые расчеты
- **Advanced analytics**: Детальная аналитика использования
- **A/B testing**: Тестирование разных алгоритмов

## Дополнительный план: Добавление поля процента жира

### Обзор
Добавление необязательного поля "Процент жира" в интерфейс расчета калорий для повышения точности расчетов. При отсутствии данных будет использоваться стандартная формула с пониженной точностью.

### Цели
1. **Повышение точности**: Более точные расчеты при наличии данных о проценте жира
2. **Гибкость**: Необязательное поле для пользователей без данных
3. **Информированность**: Понятные подсказки о влиянии на точность

### Детальный план реализации

#### Этап 1: Обновление типов данных (30 минут)

##### 1.1 Добавление поля в интерфейсы
- **Файл**: `src/features/calorie-calculation/models/calorie-data.types.ts`
- **Изменения**:
  ```typescript
  export interface BasicData {
    gender: Gender;
    age: number;
    height: number;
    weight: number;
    bodyFatPercentage?: number; // Новое необязательное поле
  }

  export interface CalorieCalculationData extends BasicData, ActivityData {
    bodyFatPercentage?: number; // Наследование от BasicData
  }
  ```

##### 1.2 Обновление констант
- **Добавить**:
  ```typescript
  export const BODY_FAT_PERCENTAGE_LIMITS = {
    MIN: 3,
    MAX: 50,
  } as const;
  ```

#### Этап 2: Обновление компонентов формы (1-2 часа)

##### 2.1 Обновление BasicDataFormComponent
- **Файл**: `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.ts`
- **Изменения**:
  - Добавить поле `bodyFatPercentage` в форму
  - Добавить валидацию (3-50%)
  - Добавить подсказку о точности

##### 2.2 Обновление шаблона формы
- **Файл**: `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.html`
- **Добавить**:
  ```html
  <div class="form-field">
    <label for="bodyFatPercentage">Body Fat Percentage (Optional)</label>
    <input 
      id="bodyFatPercentage"
      type="number"
      [formControl]="bodyFatPercentageControl"
      placeholder="e.g., 15"
      min="3"
      max="50"
      step="0.1"
    />
    <div class="field-hint">
      <p>💡 <strong>Tip:</strong> Providing your body fat percentage will significantly improve calculation accuracy. 
      Without it, we'll use standard formulas with lower precision.</p>
    </div>
  </div>
  ```

##### 2.3 Обновление стилей
- **Файл**: `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.scss`
- **Добавить**:
  ```scss
  .field-hint {
    margin-top: 8px;
    padding: 12px;
    background-color: var(--tui-info-bg);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.4;
    
    p {
      margin: 0;
      color: var(--tui-text-02);
    }
  }
  ```

#### Этап 3: Обновление сервисов (1 час)

##### 3.1 Обновление CalorieApiService
- **Файл**: `src/features/calorie-calculation/services/calorie-api.service.ts`
- **Изменения**:
  - Передача `bodyFatPercentage` в API запросе
  - Обработка случая отсутствия данных

##### 3.2 Обновление валидации
- **Добавить валидатор**:
  ```typescript
  export function bodyFatPercentageValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null; // Поле необязательное
    }
    
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 3 || numValue > 50) {
      return { bodyFatPercentage: { message: 'Body fat percentage must be between 3% and 50%' } };
    }
    
    return null;
  }
  ```

#### Этап 4: Обновление API интеграции (30 минут)

##### 4.1 Обновление типов API
- **Файл**: `src/features/calorie-calculation/models/api.types.ts`
- **Изменения**:
  ```typescript
  interface CalorieCalculationRequest {
    gender: "male" | "female";
    age: number;
    height: number;
    weight: number;
    activityLevel: string;
    goal: string;
    bodyFatPercentage?: number; // Новое необязательное поле
  }
  ```

##### 4.2 Обновление сервиса
- **Файл**: `src/features/calorie-calculation/services/calorie-api.service.ts`
- **Изменения**:
  - Включение `bodyFatPercentage` в API запрос
  - Обработка случая отсутствия данных

#### Этап 5: Обновление UI/UX (1 час)

##### 5.1 Добавление иконки и подсказки
- **Файл**: `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.html`
- **Добавить**:
  ```html
  <div class="form-field">
    <label for="bodyFatPercentage" class="field-label">
      <span>Body Fat Percentage</span>
      <span class="optional-badge">Optional</span>
    </label>
    <div class="input-with-hint">
      <input 
        id="bodyFatPercentage"
        type="number"
        [formControl]="bodyFatPercentageControl"
        placeholder="e.g., 15"
        min="3"
        max="50"
        step="0.1"
      />
      <button 
        type="button" 
        class="hint-button"
        (click)="showBodyFatHint = !showBodyFatHint"
        [attr.aria-expanded]="showBodyFatHint"
      >
        <tui-icon icon="tuiIconHelpCircle"></tui-icon>
      </button>
    </div>
    
    @if (showBodyFatHint) {
      <div class="field-hint">
        <h4>Why provide body fat percentage?</h4>
        <ul>
          <li><strong>Higher accuracy:</strong> More precise calorie calculations</li>
          <li><strong>Better results:</strong> Tailored recommendations</li>
          <li><strong>Optional:</strong> Standard formulas work without it</li>
        </ul>
        <p><strong>How to measure:</strong> Use body fat scales, DEXA scan, or calipers</p>
      </div>
    }
  </div>
  ```

##### 5.2 Обновление стилей
- **Файл**: `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.scss`
- **Добавить**:
  ```scss
  .field-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .optional-badge {
    background-color: var(--tui-secondary);
    color: var(--tui-text-02);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .input-with-hint {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hint-button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--tui-text-03);
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s;

    &:hover {
      color: var(--tui-primary);
    }
  }

  .field-hint {
    margin-top: 12px;
    padding: 16px;
    background-color: var(--tui-info-bg);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;

    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
    }

    ul {
      margin: 8px 0;
      padding-left: 16px;
    }

    li {
      margin-bottom: 4px;
    }

    p {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: var(--tui-text-02);
    }
  }
  ```

#### Этап 6: Тестирование (1-2 часа)

##### 6.1 Unit тесты
- **Файлы**: 
  - `basic-data-form.component.spec.ts`
  - `calorie-api.service.spec.ts`
- **Покрытие**:
  - Валидация поля процента жира
  - Отправка данных в API
  - Обработка отсутствующих данных

##### 6.2 Integration тесты
- **Покрытие**:
  - Полный flow с процентом жира
  - Полный flow без процента жира
  - Валидация граничных значений

##### 6.3 E2E тесты
- **Сценарии**:
  - Расчет с процентом жира
  - Расчет без процента жира
  - Валидация ввода

### Критерии успеха

#### Функциональные
- [ ] Поле процента жира добавлено в форму
- [ ] Валидация работает корректно
- [ ] Данные передаются в API
- [ ] Подсказки понятны пользователю

#### Технические
- [ ] Покрытие тестами > 80%
- [ ] Валидация граничных значений
- [ ] Обработка отсутствующих данных
- [ ] Нет критических ошибок

#### UX
- [ ] Поле необязательное
- [ ] Подсказки информативные
- [ ] Валидация понятная
- [ ] Интерфейс интуитивный

### Временные рамки

- **Общее время**: 5-7 часов
- **Этап 1**: 30 минут
- **Этап 2**: 1-2 часа
- **Этап 3**: 1 час
- **Этап 4**: 30 минут
- **Этап 5**: 1 час
- **Этап 6**: 1-2 часа

### Следующие шаги

1. **Подтверждение плана** с командой
2. **Создание feature branch** для новой функциональности
3. **Начало реализации** с обновления типов
4. **Итеративная разработка** с тестированием
5. **Code review** перед merge
6. **Мониторинг** после деплоя
