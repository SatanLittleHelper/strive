# План реализации фичи "Дневник калорий" (Food Diary)

## Обзор фичи
MVP версия дневника калорий для отслеживания потребления продуктов через сканирование штрихкодов с использованием Open Food Facts API.

## Основные возможности MVP
1. Сканирование штрихкода продукта через камеру
2. Получение информации о продукте из Open Food Facts API
3. Отображение КБЖУ (калории, белки, жиры, углеводы)
4. Добавление продукта в дневник с указанием количества
5. Просмотр дневника за текущий день
6. Подсчет общего КБЖУ за день

## Архитектура решения

### Структура в FSD архитектуре

```
src/
├── pages/
│   └── food-diary/              # Страница дневника
│       ├── index.ts
│       ├── food-diary.routes.ts
│       └── ui/
│           ├── food-diary.component.ts
│           ├── food-diary.component.html
│           └── food-diary.component.scss
│
├── widgets/
│   ├── daily-summary/           # Виджет суммы за день
│   │   └── ui/
│   │       └── daily-summary-widget.component.ts
│   └── food-entries-list/       # Виджет списка записей
│       └── ui/
│           └── food-entries-list-widget.component.ts
│
├── features/
│   ├── barcode-scanner/         # Фича сканирования штрихкода
│   │   ├── models/
│   │   │   └── barcode.types.ts
│   │   ├── services/
│   │   │   └── barcode-scanner.service.ts
│   │   └── ui/
│   │       └── barcode-scanner/
│   │           └── barcode-scanner.component.ts
│   │
│   ├── food-search/             # Фича поиска продукта
│   │   ├── models/
│   │   │   └── food-product.types.ts
│   │   ├── services/
│   │   │   ├── open-food-facts-api.service.ts
│   │   │   └── food-search.service.ts
│   │   └── ui/
│   │       └── food-details-modal/
│   │           └── food-details-modal.component.ts
│   │
│   └── food-diary-management/   # Фича управления дневником
│       ├── models/
│       │   └── food-entry.types.ts
│       ├── services/
│       │   └── food-diary.service.ts
│       └── ui/
│           ├── add-food-entry-form/
│           │   └── add-food-entry-form.component.ts
│           └── food-entry-card/
│               └── food-entry-card.component.ts
│
├── entities/
│   └── food/                    # Сущность продукта
│       ├── model/
│       │   └── food.types.ts
│       └── ui/
│           └── food-nutrients-display/
│               └── food-nutrients-display.component.ts
│
└── shared/
    └── ui/
        └── scanner-modal/       # Модальное окно для сканера
            └── scanner-modal.component.ts
```

### Технологии и библиотеки

1. **Сканирование штрихкодов**:
   - `@zxing/browser` и `@zxing/library` - для декодирования штрихкодов
   - WebRTC API для доступа к камере

2. **API интеграция**:
   - Open Food Facts API (https://world.openfoodfacts.org/api/v2)
   - HttpClient для запросов

3. **Хранение данных**:
   - localStorage для MVP (позже можно мигрировать на IndexedDB)
   - Signals для state management

4. **UI компоненты**:
   - Taiga UI для форм и модальных окон
   - Custom scanner overlay

## Детальный план реализации

### Итерация 1: Базовая инфраструктура (MVP основа)

#### 1.1 Создание страницы Food Diary
- ⏳ Создать страницу `food-diary` с базовой структурой
- ⏳ Настроить роутинг
- ⏳ Создать базовый layout с заголовком и кнопкой добавления

#### 1.2 Создание сущности Food
- ⏳ Определить типы для продукта:
  ```typescript
  interface FoodProduct {
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    nutrients: FoodNutrients;
  }
  
  interface FoodNutrients {
    calories: number;      // kcal per 100g
    proteins: number;      // g per 100g
    fats: number;         // g per 100g
    carbohydrates: number; // g per 100g
  }
  ```
- ⏳ Создать компонент отображения КБЖУ

#### 1.3 Интеграция с Open Food Facts API
- ⏳ Создать сервис `OpenFoodFactsApiService`
- ⏳ Реализовать метод получения продукта по штрихкоду
- ⏳ Добавить обработку ошибок и fallback для отсутствующих продуктов
- ⏳ Создать маппинг данных API в наши модели

### Итерация 2: Сканирование штрихкодов

#### 2.1 Реализация сканера штрихкодов
- ⏳ Установить и настроить ZXing библиотеки
- ⏳ Создать сервис `BarcodeScannerService`
- ⏳ Реализовать доступ к камере через WebRTC
- ⏳ Создать компонент сканера с preview камеры

#### 2.2 UI для сканера
- ⏳ Создать модальное окно для сканера
- ⏳ Добавить overlay с рамкой для сканирования
- ⏳ Реализовать кнопки управления (закрыть, переключить камеру)
- ⏳ Добавить индикатор процесса сканирования

#### 2.3 Интеграция сканера с поиском продукта
- ⏳ Связать результат сканирования с API запросом
- ⏳ Показать loading состояние
- ⏳ Отобразить результат или ошибку

### Итерация 3: Управление дневником

#### 3.1 Модель записи в дневнике
- ⏳ Создать типы для записей:
  ```typescript
  interface FoodEntry {
    id: string;
    date: string; // ISO date
    product: FoodProduct;
    amount: number; // в граммах
    mealType?: MealType; // завтрак, обед, ужин, перекус
    timestamp: number;
  }
  ```

#### 3.2 Сервис управления дневником
- ⏳ Создать `FoodDiaryService` с методами:
  - Добавление записи
  - Получение записей за день
  - Удаление записи
  - Подсчет суммарного КБЖУ
- ⏳ Реализовать сохранение в localStorage

#### 3.3 Форма добавления продукта
- ⏳ Создать форму с полями:
  - Количество (в граммах)
  - Тип приема пищи (опционально)
- ⏳ Валидация данных
- ⏳ Расчет КБЖУ на основе количества

### Итерация 4: Отображение дневника

#### 4.1 Виджет суммы за день
- ⏳ Отображение общего КБЖУ за день
- ⏳ Прогресс относительно целевых значений (если есть)
- ⏳ Красивая визуализация с иконками

#### 4.2 Список записей
- ⏳ Группировка по типу приема пищи
- ⏳ Карточки продуктов с фото и КБЖУ
- ⏳ Возможность удаления записи свайпом или кнопкой

#### 4.3 Пустое состояние
- ⏳ Дружелюбное сообщение когда нет записей
- ⏳ Кнопка быстрого добавления

### Итерация 5: Полировка и UX улучшения

#### 5.1 Обработка edge cases
- ⏳ Продукт не найден в базе
- ⏳ Нет доступа к камере
- ⏳ Плохое качество штрихкода
- ⏳ Offline режим

#### 5.2 Улучшения UX
- ⏳ Анимации добавления/удаления
- ⏳ Haptic feedback при сканировании
- ⏳ Автофокус на поле количества
- ⏳ Быстрые кнопки количества (50г, 100г, 200г)

#### 5.3 Оптимизация
- ⏳ Кеширование результатов API
- ⏳ Lazy loading для сканера
- ⏳ Оптимизация размера изображений

## Технические детали реализации

### Open Food Facts API

Базовый URL: `https://world.openfoodfacts.org/api/v2`

Endpoint для получения продукта:
```
GET /product/{barcode}
```

Пример ответа:
```json
{
  "product": {
    "product_name": "Product Name",
    "brands": "Brand Name",
    "image_url": "https://...",
    "nutriments": {
      "energy-kcal_100g": 250,
      "proteins_100g": 10,
      "fat_100g": 15,
      "carbohydrates_100g": 20
    }
  }
}
```

### Сканирование штрихкодов

```typescript
// Пример использования ZXing
const codeReader = new BrowserMultiFormatReader();
const videoElement = document.getElementById('video');

codeReader.decodeFromVideoDevice(
  undefined, 
  videoElement, 
  (result, error) => {
    if (result) {
      console.log('Barcode:', result.getText());
    }
  }
);
```

### Хранение данных

```typescript
// Структура в localStorage
{
  "food_diary_entries": [
    {
      "id": "uuid",
      "date": "2024-01-15",
      "product": { /* ... */ },
      "amount": 150,
      "mealType": "breakfast",
      "timestamp": 1705334400000
    }
  ],
  "food_cache": {
    "barcode123": { /* cached product data */ }
  }
}
```

## Потенциальные проблемы и решения

1. **Проблема**: Не все продукты есть в Open Food Facts
   **Решение**: Возможность ручного ввода КБЖУ

2. **Проблема**: Плохое качество камеры или освещения
   **Решение**: Возможность ручного ввода штрихкода

3. **Проблема**: Большой объем данных в localStorage
   **Решение**: Ограничение истории (например, 30 дней)

4. **Проблема**: Разные форматы штрихкодов
   **Решение**: ZXing поддерживает множество форматов

## Будущие улучшения (после MVP)

1. Поиск продуктов по названию
2. Создание своих продуктов
3. Избранные продукты
4. История и статистика
5. Экспорт данных
6. Синхронизация с сервером
7. Рецепты и блюда
8. Интеграция с фитнес-трекерами
9. Рекомендации по питанию
10. Barcode scanning через Telegram WebApp API (когда появится)

## Критерии готовности MVP

- [ ] Можно отсканировать штрихкод продукта
- [ ] Получается информация о КБЖУ из API
- [ ] Можно добавить продукт в дневник с указанием веса
- [ ] Отображается список добавленных продуктов за день
- [ ] Показывается суммарное КБЖУ за день
- [ ] Можно удалить запись из дневника
- [ ] Данные сохраняются при перезагрузке
- [ ] Работает на мобильных устройствах в Telegram