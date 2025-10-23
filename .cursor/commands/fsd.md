Создай структуру согласно FSD архитектуре:

**Требования:**

- Следуй строгим границам между слоями
- Используй barrel exports через index.ts
- Соблюдай иерархию импортов: app → pages → widgets → features → entities → shared
- Всегда создавай index.ts для публичного API

**Структура слоев:**

```
src/
├── app/                    # Application layer
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── pages/                  # Pages layer
│   ├── dashboard/
│   │   ├── dashboard.routes.ts
│   │   ├── index.ts
│   │   └── ui/
│   └── calorie-calculator/
├── widgets/                # Widgets layer
│   ├── next-workout/
│   ├── calorie-widget/
│   └── macronutrients-widget/
├── features/               # Features layer
│   ├── calorie-calculation/
│   │   ├── models/
│   │   ├── services/
│   │   └── ui/
│   └── macronutrients-calculation/
├── entities/               # Entities layer
│   ├── calorie/
│   ├── macronutrients/
│   └── workout/
└── shared/                 # Shared layer
    ├── lib/
    ├── services/
    └── ui/
```

**Правила импортов:**

- **app** может импортировать из всех слоев
- **pages** может импортировать из widgets, features, entities, shared
- **widgets** может импортировать из features, entities, shared
- **features** может импортировать из entities, shared
- **entities** может импортировать только из shared
- **shared** не может импортировать из других слоев

**Примеры правильных импортов:**

```typescript
// ✅ Правильно - импорт из нижнего слоя
import { SomeService } from '@/shared/services/some';
import { SomeEntity } from '@/entities/some';
import { SomeFeature } from '@/features/some';

// ❌ Неправильно - импорт из верхнего слоя
import { SomePage } from '@/pages/some-page';
import { SomeWidget } from '@/widgets/some-widget';
```

**Структура файлов в слое:**

```
feature-name/
├── index.ts                 # Public API
├── models/                  # Типы и интерфейсы
│   ├── index.ts
│   └── feature.types.ts
├── services/                # Бизнес-логика
│   ├── index.ts
│   ├── feature.service.ts
│   └── feature-api.service.ts
└── ui/                      # UI компоненты
    ├── index.ts
    ├── feature-form/
    └── feature-display/
```

**Barrel exports (index.ts):**

```typescript
// index.ts - публичный API слоя
export { FeatureService } from './services/feature.service';
export { FeatureApiService } from './services/feature-api.service';
export { FeatureFormComponent } from './ui/feature-form/feature-form.component';
export { FeatureDisplayComponent } from './ui/feature-display/feature-display.component';
export type { FeatureData } from './models/feature.types';
```

**Шаги:**

1. Определи в каком слое должен быть код
2. Создай структуру папок согласно FSD
3. Создай все необходимые файлы
4. Настрой barrel exports в index.ts
5. Проверь что импорты соответствуют правилам FSD
6. Обнови ESLint boundaries если нужно

**Примеры структур:**

- **Feature**: `src/features/calorie-calculation/`
- **Entity**: `src/entities/macronutrients/`
- **Widget**: `src/widgets/calorie-widget/`
- **Page**: `src/pages/dashboard/`
- **Shared**: `src/shared/ui/back-layout/`

Создай структуру согласно FSD и покажи результат.