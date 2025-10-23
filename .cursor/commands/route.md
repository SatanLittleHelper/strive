Создай Angular роут согласно FSD архитектуре:

**Требования:**

- Используй UPPER_SNAKE_CASE для названий роутов
- Используй kebab-case для путей роутов
- Всегда добавляй title для роутов
- Используй lazy loading для страниц
- Следуй FSD архитектуре

**Структура роута:**

```typescript
// page-name.routes.ts
import { PageNameComponent } from './ui/page-name.component';
import type { Routes } from '@angular/router';

export const PAGE_NAME_ROUTES: Routes = [
  {
    path: '',
    component: PageNameComponent,
    title: 'Page Title',
  },
];

// index.ts
export { PAGE_NAME_ROUTES } from './page-name.routes';
export { PageNameComponent } from './ui/page-name.component';
```

**Шаги:**

1. Создай файл роутов в папке страницы
2. Определи структуру роутов с UPPER_SNAKE_CASE
3. Добавь lazy loading в основной app.routes.ts
4. Создай barrel exports
5. Обнови основной роутинг

**Примеры роутов:**

- Dashboard: `src/pages/dashboard/dashboard.routes.ts`
- Calorie Calculator: `src/pages/calorie-calculator/calorie-calculator.routes.ts`
- Macronutrients: `src/pages/macronutrients/macronutrients.routes.ts`

**Правила для роутинга:**

- Используй UPPER_SNAKE_CASE для констант роутов
- Используй kebab-case для путей
- Всегда добавляй title для лучшего UX
- Используй lazy loading для производительности
- Следуй структуре FSD

**Обновление основного роутинга:**

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'page-name',
    loadChildren: () => import('@/pages/page-name').then((m) => m.PAGE_NAME_ROUTES),
    title: 'Page Title',
  },
];
```

Создай роут и покажи результат.