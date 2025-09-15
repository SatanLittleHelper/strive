# План: Автоматическое обновление токенов при истечении

## Проблема
Если пользователь долго находится на странице без отправки HTTP запросов и его access токен истекает, он будет перенаправлен на страницу логина при следующей навигации через `authGuard`, даже если у него есть валидный refresh токен.

Текущий механизм обновления токенов в `authInterceptor` срабатывает только при HTTP запросах с 401 ошибкой, что не покрывает сценарий навигации без API вызовов.

## Цель
Реализовать проактивную проверку валидности access токена в `authGuard` и автоматическое обновление через refresh токен, если это возможно.

## Анализ текущего состояния

### Текущая логика AuthGuard
```typescript
// Только проверяет наличие токенов, не их валидность
export const authGuard: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  return authService.isAuthenticated(); // Только проверка наличия!
};
```

### Проблемы
1. **Нет проверки истечения access токена** в guard
2. **Нет автоматического обновления** при навигации без HTTP запросов
3. **Плохой UX** - пользователь неожиданно перенаправляется на логин

### Существующие решения
- ✅ **authInterceptor** - обновляет токены при 401 от API
- ✅ **JWT утилиты** - уже есть `getTokenExpirationSeconds()`
- ✅ **TokenRefreshManager** - управляет процессом обновления
- ✅ **AuthApiService.refresh$()** - API для обновления токенов

## Техническое решение

### Подход: Синхронное обновление в AuthGuard
Использовать существующую инфраструктуру (`AuthApiService`, `TokenRefreshManager`) для проактивного обновления токенов прямо в guard.

### Преимущества
- Переиспользование существующего кода
- Консистентная логика с interceptor
- Прозрачность для пользователя
- Минимальные изменения в архитектуре

## Детальная реализация

### Этап 1: Расширение AuthService
**Файл:** `src/features/auth/services/auth.service.ts`

Добавить методы:
```typescript
isAccessTokenExpired(): boolean;
refreshTokenSync(): Promise<boolean>;
```

### Этап 2: Создание Token Validation Service
**Файл:** `src/features/auth/services/token-validation.service.ts`

Новый сервис для проверки и обновления токенов:
```typescript
@Injectable({ providedIn: 'root' })
export class TokenValidationService {
  async validateAndRefreshIfNeeded(): Promise<boolean>;
  isAccessTokenValid(): boolean;
  private performTokenRefresh(): Promise<boolean>;
}
```

### Этап 3: Обновление AuthGuard
**Файл:** `src/features/auth/guards/auth.guard.ts`

Добавить асинхронную проверку и обновление токенов:
```typescript
export const authGuard: CanMatchFn = async (): Promise<boolean> => {
  const tokenValidation = inject(TokenValidationService);
  const router = inject(Router);

  const isValid = await tokenValidation.validateAndRefreshIfNeeded();
  
  if (!isValid) {
    // Сохранить return URL и редирект на логин
    return false;
  }
  
  return true;
};
```

### Этап 4: Интеграция с существующим TokenRefreshManager
Переиспользовать логику из interceptor для избежания дублирования запросов refresh.

## Этапы реализации

### Этап 1: Расширение AuthService ⏳
**Задачи:**
1. Добавить метод `isAccessTokenExpired()` используя `getTokenExpirationSeconds()`
2. Добавить метод `refreshTokenSync()` как Promise wrapper для `authApi.refresh$()`
3. Обновить `isAuthenticated()` для учета валидности токена
4. Написать тесты для новых методов

**Ожидаемый результат:** AuthService может проверять и обновлять токены синхронно

### Этап 2: Создание TokenValidationService ⏳
**Задачи:**
1. Создать новый сервис для валидации токенов
2. Интегрировать с TokenRefreshManager для избежания дублирования
3. Реализовать логику проверки и обновления
4. Покрыть тестами все сценарии

**Ожидаемый результат:** Централизованная логика валидации токенов

### Этап 3: Обновление AuthGuard ⏳
**Задачи:**
1. Сделать guard асинхронным (CanMatchFn возвращает Promise<boolean>)
2. Добавить проверку валидности токена
3. Реализовать автоматическое обновление
4. Обновить тесты для асинхронной логики

**Ожидаемый результат:** Guard проактивно обновляет токены

### Этап 4: Интеграционное тестирование ⏳
**Задачи:**
1. Тестирование совместной работы с authInterceptor
2. Проверка отсутствия дублирования refresh запросов
3. E2E тестирование пользовательских сценариев
4. Нагрузочное тестирование guard на производительность

**Ожидаемый результат:** Система работает стабильно во всех сценариях

## Сценарии использования

### Сценарий 1: Токен истёк, refresh валиден
1. Пользователь пытается перейти на защищённую страницу
2. AuthGuard обнаруживает истёкший access токен
3. Автоматически обновляет токен через refresh
4. Пропускает пользователя на страницу
5. **Результат:** Пользователь не замечает проблемы

### Сценарий 2: Оба токена истекли
1. Пользователь пытается перейти на защищённую страницу
2. AuthGuard обнаруживает истёкшие токены
3. Очищает токены из storage
4. Перенаправляет на страницу логина
5. **Результат:** Пользователь переходит к повторной аутентификации

### Сценарий 3: Одновременные навигации
1. Несколько переходов происходят одновременно
2. TokenRefreshManager предотвращает дублирование refresh запросов
3. Все guards ожидают результата одного refresh
4. **Результат:** Нет лишних запросов к серверу

## Технические детали

### Интеграция с TokenRefreshManager
```typescript
// В TokenValidationService
async validateAndRefreshIfNeeded(): Promise<boolean> {
  if (this.isAccessTokenValid()) {
    return true;
  }

  const refreshManager = TokenRefreshManager.getInstance();
  
  if (refreshManager.isRefreshInProgress) {
    // Ожидание завершения текущего refresh
    return this.waitForRefreshCompletion();
  }
  
  return this.performTokenRefresh();
}
```

### Обработка ошибок
```typescript
private async performTokenRefresh(): Promise<boolean> {
  try {
    const refreshToken = this.tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      this.authService.logout();
      return false;
    }
    
    const response = await firstValueFrom(this.authApi.refresh$(refreshToken));
    this.tokenStorage.setTokens(response.access_token, refreshToken);
    
    return true;
  } catch {
    this.authService.logout();
    return false;
  }
}
```

## Тестирование

### Unit тесты
1. **TokenValidationService** - все методы валидации и обновления
2. **AuthService** - новые методы проверки токенов
3. **AuthGuard** - асинхронная логика обновления

### Интеграционные тесты
1. **Guard + Interceptor** - совместная работа без дублирования
2. **TokenRefreshManager** - корректная синхронизация запросов
3. **Error handling** - различные сценарии ошибок

### E2E тесты
1. **Пользовательские сценарии** - полный flow с истёкшими токенами
2. **Производительность** - время выполнения guard
3. **Стрессовое тестирование** - множественные одновременные переходы

## Риски и митигация

### Производительность
**Риск:** Замедление навигации из-за проверки токенов
**Митигация:** Кеширование результатов, оптимизация JWT декодирования

### Надёжность
**Риск:** Ошибки в guard могут заблокировать доступ
**Митигация:** Fallback логика, подробное логирование ошибок

### UX
**Риск:** Задержки при навигации во время refresh
**Митигация:** Показ индикатора загрузки, таймауты для refresh

## Критерии готовности

### Функциональные
- ✅ Guard проверяет валидность access токена
- ✅ Автоматическое обновление при наличии refresh токена
- ✅ Корректная обработка истёкших refresh токенов
- ✅ Интеграция с существующим interceptor без дублирования

### Нефункциональные
- ✅ Время выполнения guard < 100ms (без сетевых запросов)
- ✅ Время refresh < 2 секунд
- ✅ Покрытие тестами > 90%
- ✅ Обратная совместимость

### UX
- ✅ Пользователь не видит неожиданных редиректов на логин
- ✅ Плавная навигация без заметных задержек
- ✅ Корректная обработка ошибок сети

## Дальнейшие улучшения

### Фаза 2: Проактивное обновление
- Фоновое обновление токенов за 5 минут до истечения
- Periodic refresh во время активности пользователя

### Фаза 3: UX улучшения
- Toast уведомления о проблемах с токенами
- Индикатор загрузки при refresh
- Retry механизм для сетевых ошибок

---

**Статус:** ⏳ Ожидает реализации  
**Приоритет:** Высокий  
**Сложность:** Средняя  
**Время реализации:** 2-3 итерации
