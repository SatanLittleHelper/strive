Создай Angular компонент согласно FSD архитектуре:

**Требования:**

- Используй standalone компоненты без NgModules
- Используй signals для state management
- Используй inject() вместо constructor injection
- Используй OnPush change detection strategy
- Следуй FSD архитектуре (app → pages → widgets → features → entities → shared)
- Используй Taiga UI компоненты для UI
- Используй BEM методологию для CSS классов
- Все функции с явными типами возвращаемых значений
- БЕЗ КОММЕНТАРИЕВ в коде
- Все строки на английском языке

**Структура компонента:**

```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton, TuiInputModule],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.scss']
})
export class ComponentNameComponent {
  private readonly service = inject(SomeService);
  
  readonly inputData = input.required<string>();
  readonly optionalInput = input(false);
  readonly dataChanged = output<string>();
  
  readonly computedValue = computed(() => 
    this.inputData().toUpperCase()
  );
}
```

**Шаги:**

1. Определи в каком слое FSD должен быть компонент
2. Создай структуру файлов:
   - `component-name.component.ts`
   - `component-name.component.html`
   - `component-name.component.scss`
   - `component-name.component.spec.ts`
   - `index.ts` (barrel export)
3. Реализуй компонент с современным Angular синтаксисом
4. Добавь типизацию и signals
5. Создай тесты с `configureZonelessTestingModule()`
6. Обнови barrel exports

**Примеры компонентов:**

- Страница: `src/pages/dashboard/ui/dashboard.component.ts`
- Виджет: `src/widgets/calorie-widget/calorie-widget.component.ts`
- Фича: `src/features/calorie-calculation/ui/basic-data-form/basic-data-form.component.ts`
- Сущность: `src/entities/calorie/ui/calorie-display.component.ts`
- Общий: `src/shared/ui/back-layout/back-layout.component.ts`

Создай компонент и покажи результат.
