import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SET_RESULT_LIMITS, type SetResult } from '@strive/api-interfaces';
import { TuiButton, TuiNotification } from '@taiga-ui/core';
import { TuiBadge, TuiInputNumber, TuiTextarea } from '@taiga-ui/kit';
import { finalize } from 'rxjs';
import {
  isSameFormValues,
  SessionsService,
  toFormValues,
  validateSetInput,
  type SetFormValues,
} from '..';
import type { FillRequest } from '../session-form.types';

@Component({
  selector: 'app-set-row',
  imports: [FormsModule, TuiButton, TuiNotification, TuiBadge, TuiInputNumber, TuiTextarea],
  templateUrl: './set-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SetRowComponent {
  readonly sessionId = input.required<number>();
  readonly exerciseId = input.required<number>();
  readonly setNumber = input.required<number>();
  readonly defaults = input.required<SetFormValues>();
  readonly result = input<SetResult>();
  readonly open = input(false);
  readonly fillRequest = input<FillRequest | null>(null);
  readonly disabled = input(false);
  readonly pendingChange = output<boolean>();

  private readonly sessions = inject(SessionsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly limits = SET_RESULT_LIMITS;
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  private readonly initial = computed<SetFormValues>(() => {
    const saved = this.result();
    if (saved) return toFormValues(saved);

    const fill = this.fillRequest();

    return fill && fill.setNumber === this.setNumber() ? fill.values : this.defaults();
  });

  protected readonly expanded = linkedSignal(() => this.open());

  // Введённое пользователем не затирается пересчётом значений по умолчанию (например, когда
  // приходит история); новый запрос подстановки из истории сбрасывает форму всегда.
  protected readonly form = linkedSignal<
    { values: SetFormValues; fill: FillRequest | null },
    SetFormValues
  >({
    source: () => ({ values: this.initial(), fill: this.fillRequest() }),
    computation: (source, previous) =>
      previous &&
      source.fill === previous.source.fill &&
      !isSameFormValues(previous.value, previous.source.values)
        ? previous.value
        : source.values,
  });

  protected patch(changes: Partial<SetFormValues>): void {
    this.form.update((values) => ({ ...values, ...changes }));
  }

  protected toggle(): void {
    if (this.disabled() || this.saving()) return;

    this.error.set('');
    this.expanded.update((value) => !value);
  }

  protected save(): void {
    if (this.saving() || this.disabled()) return;

    const validation = validateSetInput({
      weight: String(this.form().weight ?? ''),
      reps: String(this.form().reps ?? ''),
      rpe: String(this.form().rpe ?? ''),
      note: this.form().note,
    });
    if (!validation.ok) {
      this.error.set(validation.error);
      return;
    }

    this.error.set('');
    this.saving.set(true);
    this.pendingChange.emit(true);

    this.sessions
      .saveSet(this.sessionId(), this.exerciseId(), this.setNumber(), validation.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.pendingChange.emit(false);
        }),
      )
      .subscribe({
        next: () => this.expanded.set(false),
        error: () => this.error.set('Не удалось сохранить подход. Попробуйте ещё раз.'),
      });
  }
}
