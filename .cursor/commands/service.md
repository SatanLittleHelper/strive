Создай Angular сервис согласно FSD архитектуре:

**Требования:**

- Используй `providedIn: 'root'` для singleton сервисов
- Используй inject() вместо constructor injection
- Используй signals для state management
- Все функции с явными типами возвращаемых значений
- БЕЗ КОММЕНТАРИЕВ в коде
- Все строки на английском языке
- Используй HttpClient для API запросов
- Используй takeUntilDestroyed() для подписок

**Структура сервиса:**

```typescript
@Injectable({ providedIn: 'root' })
export class ServiceName {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  
  private readonly _data = signal<DataType | null>(null);
  readonly data = this._data.asReadonly();
  
  getData(): Observable<DataType> {
    return this.http.get<DataType>('/api/endpoint').pipe(
      takeUntilDestroyed(this.destroyRef)
    );
  }
  
  updateData(newData: DataType): void {
    this._data.set(newData);
  }
}
```

**Шаги:**

1. Определи в каком слое FSD должен быть сервис
2. Создай структуру файлов:
   - `service-name.service.ts`
   - `service-name.service.spec.ts`
   - `index.ts` (barrel export)
3. Реализуй сервис с современным Angular синтаксисом
4. Добавь типизацию и signals
5. Создай тесты с `configureZonelessTestingModule()`
6. Обнови barrel exports

**Примеры сервисов:**

- API сервис: `src/features/calorie-calculation/services/calorie-api.service.ts`
- Store сервис: `src/shared/services/user/user-store.service.ts`
- Утилитарный сервис: `src/shared/services/theme/theme.service.ts`

**Правила для API сервисов:**

- Используй HttpClient для HTTP запросов
- Используй handleApiError для обработки ошибок
- Всегда указывай типы для запросов и ответов
- Используй takeUntilDestroyed() для подписок

Создай сервис и покажи результат.
