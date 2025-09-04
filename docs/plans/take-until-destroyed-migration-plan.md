# План перехода на takeUntilDestroyed пайп - Strive Project

## 📋 Анализ текущего состояния

### 🎯 **Найденные подписки, требующие управления:**
1. `src/pages/calorie-calculator/calorie-calculator.component.ts` - 2 подписки
   - `fetchCalculateCalories().subscribe()` - строка 51
   - `fetchCaloriesResult().subscribe()` - строка 71
2. `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.ts` - 1 подписка
   - `form.valueChanges.subscribe()` - строка 68

### 🚨 **Проблемы текущей реализации:**
- Отсутствует отписка от подписок при уничтожении компонентов
- Риск утечек памяти
- Несоответствие современным практикам Angular
- Неиспользуемые импорты `OnDestroy`, `Subject`, `takeUntil` в некоторых компонентах

### ✅ **Преимущества перехода:**
1. **Автоматическое управление жизненным циклом** - отписка происходит автоматически при уничтожении компонента
2. **Упрощение кода** - не нужно создавать `Subject` и реализовывать `OnDestroy`
3. **Предотвращение утечек памяти** - гарантированная отписка
4. **Соответствие современным практикам** Angular
5. **Лучшая производительность** - меньше boilerplate кода

---

## 🚀 Детальный план реализации

### **Этап 1: Подготовка и настройка**

#### ✅ **1.1 Проверка версии Angular**
- **Текущая версия:** Angular 19.2.0 ✅
- **Статус:** `takeUntilDestroyed` доступен с Angular 16+
- **Импорт:** `import { takeUntilDestroyed } from '@angular/core/rxjs-interop';`

#### ✅ **1.2 Дополнительные зависимости**
- **Статус:** НЕ ТРЕБУЮТСЯ
- `takeUntilDestroyed` является частью стандартной библиотеки Angular

---

### **Этап 2: Рефакторинг компонентов**

#### ✅ **2.1 CalorieCalculatorComponent**
**Файл:** `src/pages/calorie-calculator/calorie-calculator.component.ts`

**Изменения:**
```typescript
// Добавить импорт
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Заменить подписки
// Старый способ:
this.calorieService.fetchCalculateCalories(calculationData).subscribe(() => {
  this.currentStep.set('results');
});

// Новый способ:
this.calorieService.fetchCalculateCalories(calculationData).pipe(
  takeUntilDestroyed()
).subscribe(() => {
  this.currentStep.set('results');
});

// И для второй подписки:
this.calorieService.fetchCaloriesResult().pipe(
  takeUntilDestroyed()
).subscribe();
```

**Задачи:**
- [ ] Добавить импорт `takeUntilDestroyed`
- [ ] Обернуть подписки в `pipe(takeUntilDestroyed())`
- [ ] Удалить ненужные импорты (если есть)

#### ✅ **2.2 BasicDataFormComponent**
**Файл:** `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.ts`

**Изменения:**
```typescript
// Добавить импорт
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Заменить подписку valueChanges
// Старый способ:
this.form.valueChanges.subscribe(() => {
  this.dataChanged.emit();
});

// Новый способ:
this.form.valueChanges.pipe(
  takeUntilDestroyed()
).subscribe(() => {
  this.dataChanged.emit();
});
```

**Задачи:**
- [ ] Добавить импорт `takeUntilDestroyed`
- [ ] Обернуть `valueChanges` в `pipe(takeUntilDestroyed())`
- [ ] Убрать подписку из `ngOnInit` (если нужно)

---

### **Этап 3: Очистка и оптимизация**

#### ✅ **3.1 Удаление неиспользуемых импортов**
**Файлы для проверки:**
- `src/features/calorie-calculation/ui/activity-goal-form/activity-goal-form.component.ts`
  - Удалить: `OnDestroy`, `Subject`, `takeUntil` (если не используются)

**Задачи:**
- [ ] Проверить все компоненты на неиспользуемые импорты
- [ ] Удалить импорты `OnDestroy`, `Subject`, `takeUntil` где они не нужны
- [ ] Запустить линтер для проверки

#### ✅ **3.2 Обновление документации**
**Задачи:**
- [ ] Обновить правила проекта в `.cursor/rules/`
- [ ] Добавить примеры использования `takeUntilDestroyed`
- [ ] Обновить README с новыми практиками

---

### **Этап 4: Тестирование**

#### ✅ **4.1 Проверка линтера**
```bash
npm run lint:ts
```

**Задачи:**
- [ ] Убедиться, что нет ошибок линтера
- [ ] Проверить соответствие правилам FSD
- [ ] Проверить форматирование кода

#### ✅ **4.2 Функциональное тестирование**
**Тестируемые сценарии:**
- [ ] Калькулятор калорий работает корректно
- [ ] Формы отправляют данные правильно
- [ ] Навигация между шагами работает
- [ ] Нет ошибок в консоли браузера

#### ✅ **4.3 Проверка утечек памяти**
**Инструменты:**
- [ ] Chrome DevTools Memory tab
- [ ] Angular DevTools
- [ ] Проверить отсутствие активных подписок после уничтожения компонентов

---

## 🔧 Технические детали реализации

### **Новый синтаксис:**
```typescript
// Старый способ
this.someObservable.subscribe(() => {
  // обработка
});

// Новый способ
this.someObservable.pipe(
  takeUntilDestroyed()
).subscribe(() => {
  // обработка
});
```

### **Для valueChanges в формах:**
```typescript
// Старый способ
this.form.valueChanges.subscribe(() => {
  this.dataChanged.emit();
});

// Новый способ
this.form.valueChanges.pipe(
  takeUntilDestroyed()
).subscribe(() => {
  this.dataChanged.emit();
});
```

### **Импорт:**
```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

---

## 📊 Статус выполнения

### ✅ **Этап 1: Подготовка**
- [x] Проверка версии Angular
- [x] Подтверждение доступности `takeUntilDestroyed`

### 🔄 **Этап 2: Рефакторинг**
- [ ] CalorieCalculatorComponent
- [ ] BasicDataFormComponent

### ⏳ **Этап 3: Очистка**
- [ ] Удаление неиспользуемых импортов
- [ ] Обновление документации

### ⏳ **Этап 4: Тестирование**
- [ ] Проверка линтера
- [ ] Функциональное тестирование
- [ ] Проверка утечек памяти

---

## 🎯 Результат

После выполнения плана:
- ✅ Все подписки будут автоматически управляться
- ✅ Код станет более чистым и современным
- ✅ Исключены утечки памяти
- ✅ Соответствие лучшим практикам Angular
- ✅ Упрощенная архитектура компонентов

---

**Дата создания:** $(date)
**Версия Angular:** 19.2.0
**Статус:** Готов к реализации
