# План: Проверка живости Access токена в Auth Guard

## Проблема
Текущий auth guard не проверяет живость (валидность/истечение) access токена. Он только проверяет наличие токена в cookies, что позволяет пользователям с истёкшими токенами проходить guard и получать 401 ошибки только при API запросах.

## Цель
Реализовать проверку живости access токена в auth guard для предотвращения доступа с истёкшими токенами и улучшения UX.

## Анализ текущего состояния

### Текущая логика AuthGuard
```typescript
// src/features/auth/guards/auth.guard.ts
export const authGuard: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  return authService.isAuthenticated(); // Только проверка наличия токена!
};
```

### Проблемы
1. **Нет проверки истечения токена** - guard пропускает истёкшие токены
2. **Нет валидации токена** - guard не проверяет подпись/валидность
3. **Реактивная проверка** - токен проверяется только при API запросах через interceptor

## Варианты решения

### Вариант 1: Декодирование JWT и проверка exp (Рекомендуемый)
**Преимущества:**
- Быстрая проверка без сетевых запросов
- Работает офлайн
- Минимальная нагрузка на сервер

**Недостатки:**
- Не проверяет валидность подписи
- Не учитывает преждевременную инвалидацию токена на сервере

### Вариант 2: API запрос для валидации токена
**Преимущества:**
- Полная валидация токена на сервере
- Учитывает все виды инвалидации

**Недостатки:**
- Дополнительные сетевые запросы на каждую навигацию
- Не работает офлайн
- Увеличенная нагрузка на сервер

### Вариант 3: Гибридный подход
**Описание:**
- Сначала проверка exp в JWT
- При приближении истечения (например, < 5 минут) - проверка через API
- Автоматический refresh при необходимости

## Выбранное решение: Вариант 1 (Декодирование JWT)

### Причины выбора
1. **Производительность** - нет дополнительных HTTP запросов
2. **UX** - мгновенная проверка без задержек
3. **Простота** - минимальные изменения в архитектуре
4. **Надёжность** - проверка работает даже офлайн

## Техническая реализация

### 1. Создание JWT утилиты
**Файл:** `src/shared/lib/utils/jwt.utils.ts`

```typescript
export interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: unknown;
}

export const decodeJwt = (token: string): JwtPayload | null;
export const isTokenExpired = (token: string): boolean;
export const getTokenExpirationTime = (token: string): Date | null;
export const isTokenExpiringSoon = (token: string, minutesThreshold: number = 5): boolean;
```

### 2. Обновление TokenStorageService
**Файл:** `src/shared/services/auth/token-storage.service.ts`

```typescript
export class TokenStorageService {
  // Добавить методы
  isAccessTokenValid(): boolean;
  isAccessTokenExpiringSoon(minutesThreshold?: number): boolean;
}
```

### 3. Обновление AuthService
**Файл:** `src/features/auth/services/auth.service.ts`

```typescript
export class AuthService {
  // Обновить метод проверки аутентификации
  isAuthenticated(): boolean;
  
  // Добавить методы
  isTokenValid(): boolean;
  private checkTokenValidity(): void;
}
```

### 4. Обновление AuthGuard
**Файл:** `src/features/auth/guards/auth.guard.ts`

```typescript
export const authGuard: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  
  if (!authService.isAuthenticated()) {
    // Редирект на логин
    return false;
  }
  
  if (!authService.isTokenValid()) {
    // Попытка автоматического обновления или логаут
    return false;
  }
  
  return true;
};
```

## Этапы разработки

### Этап 1: JWT утилиты
**Задачи:**
1. Создать `jwt.utils.ts` с функциями декодирования
2. Добавить обработку ошибок декодирования
3. Написать тесты для всех утилит
4. Покрыть edge cases (невалидный JWT, отсутствие exp и т.д.)

**Файлы:**
- `src/shared/lib/utils/jwt.utils.ts`
- `src/shared/lib/utils/jwt.utils.spec.ts`
- `src/shared/lib/utils/index.ts` (экспорт)

### Этап 2: Обновление TokenStorageService
**Задачи:**
1. Добавить методы проверки валидности токена
2. Интегрировать JWT утилиты
3. Обновить тесты с новыми методами
4. Обеспечить обратную совместимость

**Файлы:**
- `src/shared/services/auth/token-storage.service.ts`
- `src/shared/services/auth/token-storage.service.spec.ts`

### Этап 3: Обновление AuthService
**Задачи:**
1. Модифицировать логику `isAuthenticated()`
2. Добавить проверку валидности токена
3. Обновить `initFromStorage()` для учёта exp
4. Написать тесты для новых сценариев

**Файлы:**
- `src/features/auth/services/auth.service.ts`
- `src/features/auth/services/auth.service.spec.ts`

### Этап 4: Обновление AuthGuard
**Задачи:**
1. Добавить проверку валидности токена в guard
2. Реализовать обработку истёкших токенов
3. Обновить тесты guard
4. Добавить интеграционные тесты

**Файлы:**
- `src/features/auth/guards/auth.guard.ts`
- `src/features/auth/guards/auth.guard.spec.ts`

### Этап 5: Интеграция и оптимизация
**Задачи:**
1. Интеграционное тестирование всех компонентов
2. Проверка работы с auth interceptor
3. Оптимизация производительности
4. Документирование изменений

## Детали реализации

### Обработка истёкших токенов в Guard
```typescript
export const authGuard: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    void router.navigate(['/login']);
    return false;
  }

  if (!authService.isTokenValid()) {
    // Сохранить текущий URL для возврата
    const currentUrl = router.url;
    if (currentUrl !== '/login' && currentUrl !== '/register') {
      sessionStorage.setItem('return_url', currentUrl);
    }
    
    // Попытка автоматического обновления через refresh
    const refreshResult = authService.tryRefreshToken();
    if (!refreshResult) {
      void router.navigate(['/login']);
      return false;
    }
  }

  return true;
};
```

### Автоматическое обновление токена
```typescript
// В AuthService
tryRefreshToken(): boolean {
  const refreshToken = this.tokenStorage.getRefreshToken();
  if (!refreshToken) {
    this.logout();
    return false;
  }

  // Синхронная проверка - если refresh токен тоже истёк
  if (this.tokenStorage.isRefreshTokenExpired()) {
    this.logout();
    return false;
  }

  // Асинхронное обновление в фоне
  this.refreshTokenInBackground();
  return true;
}
```

## Тестирование

### Unit тесты
1. **JWT утилиты** - все функции декодирования и проверки
2. **TokenStorageService** - новые методы валидации
3. **AuthService** - обновлённая логика аутентификации
4. **AuthGuard** - все сценарии проверки токенов

### Интеграционные тесты
1. **Полный flow** - от guard до API запроса
2. **Обновление токена** - автоматический refresh
3. **Обработка ошибок** - различные виды невалидных токенов

### Edge cases
1. **Повреждённый JWT** - некорректный формат токена
2. **Отсутствие exp** - токен без времени истечения
3. **Часовые пояса** - корректная работа с UTC
4. **Одновременные запросы** - race conditions при refresh

## Риски и митигация

### Технические риски
1. **Производительность** - декодирование JWT на каждую навигацию
   - *Митигация*: кеширование результата декодирования
   
2. **Безопасность** - клиентская проверка может быть обойдена
   - *Митигация*: серверная валидация остаётся основной защитой
   
3. **Совместимость** - изменения могут сломать существующую логику
   - *Митигация*: тщательное тестирование и обратная совместимость

### UX риски
1. **Ложные срабатывания** - корректные токены отклоняются из-за ошибок
   - *Митигация*: подробное логирование и fallback на interceptor
   
2. **Задержки навигации** - медленная проверка токенов
   - *Митигация*: оптимизация алгоритмов и кеширование

## Критерии готовности

### Функциональные требования
- ✅ Guard проверяет истечение access токена
- ✅ Автоматическое обновление токена при возможности
- ✅ Корректная обработка всех типов невалидных токенов
- ✅ Сохранение return URL при редиректе на логин

### Нефункциональные требования
- ✅ Покрытие тестами > 90% для новых компонентов
- ✅ Время проверки токена < 1ms
- ✅ Обратная совместимость с существующим API
- ✅ Документация всех изменений

### Тестирование
- ✅ Все unit тесты проходят
- ✅ Интеграционные тесты покрывают основные сценарии
- ✅ Manual тестирование в различных браузерах
- ✅ E2E тесты для критических путей

## Дальнейшие улучшения

### Фаза 2: Проактивное обновление токенов
- Автоматическое обновление токенов за 5 минут до истечения
- Background refresh во время активности пользователя

### Фаза 3: Улучшенная безопасность
- Проверка подписи JWT на клиенте (опционально)
- Дополнительная валидация claims в токене

### Фаза 4: Производительность
- Кеширование результатов декодирования JWT
- Оптимизация для high-frequency навигации

---

**Автор:** AI Assistant  
**Дата создания:** 2025-01-12  
**Версия:** 1.0  
**Статус:** Планирование
