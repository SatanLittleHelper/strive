# План интеграции Toast-сообщений для обработки ошибок API

## 📊 Обзор

**Цель**: Создать универсальную систему toast-уведомлений для обработки ошибок API и улучшения пользовательского опыта в приложении Strive.

**Приоритет**: Высокий  
**Время выполнения**: 1-2 недели  
**Статус**: ⏳ Ожидает

## 🎯 Основные задачи

### **Этап 1: Создание ToastService (1 неделя)**

#### **1.1 Базовый ToastService**
- [ ] **ToastService** - основной сервис для показа уведомлений
- [ ] **ToastComponent** - компонент для отображения toast
- [ ] **ToastContainerComponent** - контейнер для управления toast'ами
- [ ] **ToastTypes** - типы уведомлений (success, error, warning, info)

#### **1.2 Интеграция с Taiga UI**
- [ ] Использование Taiga UI компонентов для стилизации
- [ ] Адаптация под тему приложения (light/dark)
- [ ] Анимации появления/исчезновения
- [ ] Позиционирование toast'ов

#### **1.3 Конфигурация**
- [ ] Настройка времени показа (auto-dismiss)
- [ ] Максимальное количество одновременных toast'ов
- [ ] Позиционирование на экране
- [ ] Звуковые уведомления (опционально)

### **Этап 2: Интеграция с API Error Handling (1 неделя)**

#### **2.1 Расширение handleApiError**
- [ ] **ApiErrorInterceptor** - перехватчик ошибок API
- [ ] **ToastErrorMapper** - маппинг ошибок в toast сообщения
- [ ] **ErrorContextService** - контекст для ошибок
- [ ] **RetryService** - сервис для повторных попыток

#### **2.2 Типизированные ошибки**
- [ ] **ApiErrorTypes** - типы ошибок API
- [ ] **ErrorMessages** - сообщения для разных типов ошибок
- [ ] **ErrorActions** - действия для ошибок (retry, dismiss, etc.)
- [ ] **ErrorLogging** - логирование ошибок

#### **2.3 Интеграция с существующими сервисами**
- [ ] **AuthService** - ошибки авторизации
- [ ] **CalorieApiService** - ошибки расчета калорий
- [ ] **UserApiService** - ошибки пользовательских данных
- [ ] **OfflineSyncService** - ошибки синхронизации

## 🔧 Технические детали

### **Архитектура сервисов**

```typescript
// src/shared/services/toast/
├── toast.service.ts              // Главный сервис toast уведомлений
├── toast-error-mapper.service.ts // Маппинг ошибок в сообщения
├── toast-config.service.ts       // Конфигурация toast'ов
├── toast-queue.service.ts        // Очередь toast'ов
└── index.ts                      // Public API
```

### **UI компоненты**

```typescript
// src/shared/ui/
├── toast/                        // Toast компоненты
│   ├── toast/
│   │   ├── toast.component.ts
│   │   ├── toast.component.html
│   │   ├── toast.component.scss
│   │   └── index.ts
│   ├── toast-container/
│   │   ├── toast-container.component.ts
│   │   ├── toast-container.component.html
│   │   ├── toast-container.component.scss
│   │   └── index.ts
│   └── index.ts
```

### **Типы и интерфейсы**

```typescript
// src/shared/lib/types/toast.types.ts
export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  actions?: ToastAction[];
  persistent?: boolean;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary';
}

export interface ToastConfig {
  position: ToastPosition;
  maxToasts: number;
  defaultDuration: number;
  enableSound: boolean;
}

export type ToastPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-center' 
  | 'bottom-center';
```

## 📋 Детальный план реализации

### **Этап 1: Создание ToastService (5-7 часов)**

#### 1.1 Базовый ToastService
```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastQueue = signal<ToastMessage[]>([]);
  private readonly config = signal<ToastConfig>({
    position: 'top-right',
    maxToasts: 5,
    defaultDuration: 5000,
    enableSound: false,
  });

  readonly toasts = this.toastQueue.asReadonly();

  success(message: string, title?: string, options?: Partial<ToastMessage>): void {
    this.show({ type: 'success', message, title, ...options });
  }

  error(message: string, title?: string, options?: Partial<ToastMessage>): void {
    this.show({ type: 'error', message, title, persistent: true, ...options });
  }

  warning(message: string, title?: string, options?: Partial<ToastMessage>): void {
    this.show({ type: 'warning', message, title, ...options });
  }

  info(message: string, title?: string, options?: Partial<ToastMessage>): void {
    this.show({ type: 'info', message, title, ...options });
  }

  private show(toast: Omit<ToastMessage, 'id'>): void {
    const id = this.generateId();
    const newToast: ToastMessage = {
      id,
      duration: this.config().defaultDuration,
      ...toast,
    };

    this.toastQueue.update(toasts => {
      const updated = [...toasts, newToast];
      return updated.slice(-this.config().maxToasts);
    });

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => this.dismiss(id), newToast.duration);
    }
  }

  dismiss(id: string): void {
    this.toastQueue.update(toasts => toasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this.toastQueue.set([]);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 1.2 ToastComponent
```typescript
@Component({
  selector: 'app-toast',
  template: `
    <div class="toast" [class]="'toast--' + toast.type">
      @if (toast.title) {
        <div class="toast__title">{{ toast.title }}</div>
      }
      <div class="toast__message">{{ toast.message }}</div>
      @if (toast.actions && toast.actions.length > 0) {
        <div class="toast__actions">
          @for (action of toast.actions; track action.label) {
            <button 
              tuiButton 
              [size]="'s'"
              [type]="action.type || 'secondary'"
              (click)="action.action()"
            >
              {{ action.label }}
            </button>
          }
        </div>
      }
      <button 
        tuiButton 
        size="s" 
        type="icon"
        class="toast__close"
        (click)="onDismiss()"
      >
        <tui-icon icon="tuiIconClose"></tui-icon>
      </button>
    </div>
  `,
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  @Input({ required: true }) toast!: ToastMessage;
  @Output() dismiss = new EventEmitter<string>();

  onDismiss(): void {
    this.dismiss.emit(this.toast.id);
  }
}
```

#### 1.3 ToastContainerComponent
```typescript
@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container" [class]="'toast-container--' + position()">
      @for (toast of toasts(); track toast.id) {
        <app-toast 
          [toast]="toast" 
          (dismiss)="onDismiss($event)"
        />
      }
    </div>
  `,
  styleUrls: ['./toast-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  private readonly configService = inject(ToastConfigService);

  readonly toasts = this.toastService.toasts;
  readonly position = this.configService.position;

  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
```

### **Этап 2: Интеграция с API Error Handling (5-7 часов)**

#### 2.1 ToastErrorMapperService
```typescript
@Injectable({ providedIn: 'root' })
export class ToastErrorMapperService {
  private readonly errorMessages: Record<string, string> = {
    'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
    'TIMEOUT': 'Request timeout. Please try again.',
    'UNAUTHORIZED': 'Authentication required. Please login again.',
    'FORBIDDEN': 'Access denied. You don\'t have permission to perform this action.',
    'NOT_FOUND': 'Requested resource not found.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'SERVER_ERROR': 'Server error occurred. Please try again later.',
    'RATE_LIMIT': 'Too many requests. Please wait a moment and try again.',
  };

  private readonly errorActions: Record<string, ToastAction[]> = {
    'NETWORK_ERROR': [
      { label: 'Retry', action: () => this.retryAction(), type: 'primary' },
      { label: 'Dismiss', action: () => {}, type: 'secondary' },
    ],
    'UNAUTHORIZED': [
      { label: 'Login', action: () => this.navigateToLogin(), type: 'primary' },
    ],
  };

  mapApiErrorToToast(error: ApiError): ToastMessage {
    const message = this.errorMessages[error.code] || error.message || 'An unexpected error occurred.';
    const actions = this.errorActions[error.code] || [];

    return {
      id: this.generateId(),
      type: this.getToastType(error.code),
      title: this.getErrorTitle(error.code),
      message,
      actions: actions.length > 0 ? actions : undefined,
      persistent: this.isPersistentError(error.code),
    };
  }

  private getToastType(errorCode: string): ToastType {
    const errorTypeMap: Record<string, ToastType> = {
      'NETWORK_ERROR': 'error',
      'TIMEOUT': 'error',
      'UNAUTHORIZED': 'warning',
      'FORBIDDEN': 'warning',
      'NOT_FOUND': 'warning',
      'VALIDATION_ERROR': 'warning',
      'SERVER_ERROR': 'error',
      'RATE_LIMIT': 'warning',
    };

    return errorTypeMap[errorCode] || 'error';
  }

  private getErrorTitle(errorCode: string): string {
    const titleMap: Record<string, string> = {
      'NETWORK_ERROR': 'Connection Error',
      'TIMEOUT': 'Request Timeout',
      'UNAUTHORIZED': 'Authentication Required',
      'FORBIDDEN': 'Access Denied',
      'NOT_FOUND': 'Not Found',
      'VALIDATION_ERROR': 'Validation Error',
      'SERVER_ERROR': 'Server Error',
      'RATE_LIMIT': 'Rate Limited',
    };

    return titleMap[errorCode] || 'Error';
  }

  private isPersistentError(errorCode: string): boolean {
    return ['UNAUTHORIZED', 'FORBIDDEN', 'SERVER_ERROR'].includes(errorCode);
  }

  private retryAction(): void {
    // Implement retry logic
  }

  private navigateToLogin(): void {
    // Navigate to login page
  }

  private generateId(): string {
    return `error-toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 2.2 ApiErrorInterceptor
```typescript
@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  private readonly toastService = inject(ToastService);
  private readonly errorMapper = inject(ToastErrorMapperService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.mapHttpErrorToApiError(error);
        const toastMessage = this.errorMapper.mapApiErrorToToast(apiError);
        
        this.toastService.error(
          toastMessage.message,
          toastMessage.title,
          {
            actions: toastMessage.actions,
            persistent: toastMessage.persistent,
          }
        );

        return throwError(() => apiError);
      })
    );
  }

  private mapHttpErrorToApiError(error: HttpErrorResponse): ApiError {
    const errorCode = this.getErrorCode(error);
    const message = error.error?.message || error.message || 'Unknown error';

    return {
      code: errorCode,
      message,
      status: error.status,
      timestamp: new Date().toISOString(),
    };
  }

  private getErrorCode(error: HttpErrorResponse): string {
    if (!navigator.onLine) return 'NETWORK_ERROR';
    if (error.status === 0) return 'NETWORK_ERROR';
    if (error.status === 401) return 'UNAUTHORIZED';
    if (error.status === 403) return 'FORBIDDEN';
    if (error.status === 404) return 'NOT_FOUND';
    if (error.status === 422) return 'VALIDATION_ERROR';
    if (error.status === 429) return 'RATE_LIMIT';
    if (error.status >= 500) return 'SERVER_ERROR';
    
    return 'UNKNOWN_ERROR';
  }
}
```

#### 2.3 Интеграция с существующими сервисами
```typescript
// В AuthService
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly toastService = inject(ToastService);

  login$(body: LoginRequest): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.authApi.login$(body).pipe(
      tap(() => {
        this.toastService.success('Welcome back!', 'Login successful');
      }),
      catchError((error: ApiError) => {
        // Toast уже показан через interceptor
        this.error.set(error.message);
        return of(undefined);
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}

// В CalorieApiService
@Injectable({ providedIn: 'root' })
export class CalorieApiService {
  private readonly toastService = inject(ToastService);

  calculateCalories(data: CalorieCalculationData): Observable<CalorieResults> {
    return this.http.post<CalorieResults>('/api/v1/calorie/calculate', data).pipe(
      tap(() => {
        this.toastService.success('Calories calculated successfully!');
      }),
      catchError((error: ApiError) => {
        // Toast уже показан через interceptor
        return throwError(() => error);
      })
    );
  }
}
```

## 🧪 Тестирование

### **Unit тесты**
- [ ] ToastService - тестирование всех методов
- [ ] ToastErrorMapperService - тестирование маппинга ошибок
- [ ] ToastComponent - тестирование отображения
- [ ] ToastContainerComponent - тестирование управления

### **Integration тесты**
- [ ] Интеграция с API interceptor
- [ ] Интеграция с существующими сервисами
- [ ] Тестирование различных типов ошибок
- [ ] Тестирование действий в toast'ах

### **E2E тесты**
- [ ] Отображение toast'ов в UI
- [ ] Автоматическое исчезновение
- [ ] Действия пользователя (dismiss, retry)
- [ ] Обработка ошибок API

## 📈 Метрики успеха

### **Функциональные метрики**
- [ ] Все типы ошибок API показывают соответствующие toast'ы
- [ ] Toast'ы появляются и исчезают корректно
- [ ] Действия в toast'ах работают правильно
- [ ] Интеграция с существующими сервисами работает

### **UX метрики**
- [ ] Понятные сообщения об ошибках
- [ ] Быстрая обратная связь для пользователя
- [ ] Не мешает основному интерфейсу
- [ ] Адаптируется под тему приложения

### **Технические метрики**
- [ ] Покрытие тестами > 90%
- [ ] Производительность не ухудшается
- [ ] Размер bundle не увеличивается значительно
- [ ] Совместимость с существующими функциями

## 🚀 План реализации

### **Неделя 1: Создание ToastService**
- День 1-2: Базовый ToastService и компоненты
- День 3-4: Стилизация и анимации
- День 5: Тестирование и интеграция

### **Неделя 2: Интеграция с API**
- День 1-2: ToastErrorMapperService и ApiErrorInterceptor
- День 3-4: Интеграция с существующими сервисами
- День 5: Тестирование и финальная проверка

## 🔗 Зависимости

### **Внутренние зависимости**
- Taiga UI - для компонентов и стилизации
- ThemeService - для адаптации под тему
- AuthService - для ошибок авторизации
- CalorieApiService - для ошибок расчета калорий
- UserApiService - для ошибок пользовательских данных

### **Внешние зависимости**
- Angular HTTP Interceptors
- RxJS для обработки ошибок
- CSS animations для анимаций

## 📋 Чеклист готовности

### **Перед началом**
- [ ] Проанализировать существующие ошибки API
- [ ] Определить типы ошибок и сообщения
- [ ] Создать архитектуру сервисов
- [ ] Настроить тестовую среду

### **Во время разработки**
- [ ] Следовать принципам FSD архитектуры
- [ ] Писать тесты для каждого сервиса
- [ ] Документировать API и интерфейсы
- [ ] Проверять совместимость с существующим кодом

### **После завершения**
- [ ] Провести полное тестирование
- [ ] Оптимизировать производительность
- [ ] Обновить документацию
- [ ] Подготовить к продакшену

## 🎯 Ожидаемые результаты

### **Для пользователей**
- Понятные сообщения об ошибках
- Быстрая обратная связь
- Возможность действий с ошибками (retry, dismiss)
- Улучшенный UX приложения

### **Для разработчиков**
- Унифицированная система обработки ошибок
- Легкое добавление новых типов ошибок
- Централизованное управление сообщениями
- Хорошее покрытие тестами

### **Для бизнеса**
- Снижение количества обращений в поддержку
- Улучшенное понимание ошибок пользователями
- Повышенная надежность приложения
- Лучший пользовательский опыт

## ⚠️ Риски и митигация

### **Потенциальные риски**
1. **Перегрузка интерфейса toast'ами**
   - Митигация: Ограничение количества одновременных toast'ов
2. **Дублирование сообщений**
   - Митигация: Дедупликация по типу ошибки
3. **Производительность**
   - Митигация: Ленивая загрузка и оптимизация

### **Критерии остановки**
- Если toast'ы мешают основному функционалу
- Если производительность значительно ухудшается
- Если пользователи жалуются на избыточность уведомлений

## 🎯 Заключение

Данный план обеспечивает создание универсальной системы toast-уведомлений, которая значительно улучшит пользовательский опыт при работе с ошибками API в приложении Strive.

**Общий бюджет времени:** 10-14 часов  
**Ожидаемое улучшение UX:** Значительное улучшение обратной связи с пользователем
