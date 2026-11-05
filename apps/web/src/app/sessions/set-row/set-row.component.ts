import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SET_RESULT_LIMITS, type SetResult } from '@strive/api-interfaces';
import { TuiButton, TuiError, TuiNotification, tuiValidationErrorsProvider } from '@taiga-ui/core';
import { TuiBadge, TuiInputNumber, TuiTextarea } from '@taiga-ui/kit';
import { finalize } from 'rxjs';
import {
  isSameFormValues,
  SessionsService,
  toFormValues,
  toSaveSetRequest,
  type SetFormValues,
} from '..';
import type { FillRequest } from '../session-form.types';
import { WEIGHT_MIN } from '../sessions.constants';
import {
  NOTE_VALIDATORS,
  REPS_VALIDATORS,
  RPE_VALIDATORS,
  WEIGHT_VALIDATORS,
} from '../set-form.validators';

const SET_ERRORS_PROVIDER = tuiValidationErrorsProvider({
  required: 'Обязательное поле',
  min: ({ min }: { min: number }) => `Не меньше ${min}`,
  max: ({ max }: { max: number }) => `Не больше ${max}`,
  integer: 'Только целое число',
  maxDecimalPlaces: ({ places }: { places: number }) => `Не более ${places} знаков после запятой`,
  maxlength: ({ requiredLength }: { requiredLength: number }) =>
    `Не больше ${requiredLength} символов`,
});

@Component({
  selector: 'app-set-row',
  imports: [
    ReactiveFormsModule,
    TuiBadge,
    TuiButton,
    TuiError,
    TuiInputNumber,
    TuiNotification,
    TuiTextarea,
  ],
  templateUrl: './set-row.component.html',
  providers: [SET_ERRORS_PROVIDER],
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
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly limits = SET_RESULT_LIMITS;
  protected readonly weightMin = WEIGHT_MIN;
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.group({
    weight: this.fb.control<number | null>(null, WEIGHT_VALIDATORS),
    reps: this.fb.control<number | null>(null, REPS_VALIDATORS),
    rpe: this.fb.control<number | null>(null, RPE_VALIDATORS),
    note: this.fb.control('', NOTE_VALIDATORS),
  });

  private appliedFill: FillRequest | null = null;
  private appliedValues: SetFormValues | null = null;

  private readonly initial = computed<SetFormValues>(() => {
    const saved = this.result();
    if (saved) return toFormValues(saved);

    const fill = this.fillRequest();

    return fill && fill.setNumber === this.setNumber() ? fill.values : this.defaults();
  });

  protected readonly expanded = linkedSignal(() => this.open());

  constructor() {
    // введённое пользователем не затирается пересчётом значений по умолчанию (например, когда
    // приходит история); новый запрос подстановки из истории сбрасывает форму всегда
    effect(() => {
      const values = this.initial();
      const fill = this.fillRequest();

      untracked(() => {
        const edited =
          this.appliedValues !== null &&
          !isSameFormValues(this.form.getRawValue(), this.appliedValues);
        if (fill === this.appliedFill && edited) return;

        this.appliedFill = fill;
        this.appliedValues = values;
        this.form.reset(values);
      });
    });

    effect(() => {
      if (this.saving() || this.disabled()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
  }

  protected toggle(): void {
    if (this.disabled() || this.saving()) return;

    this.error.set('');
    this.form.markAsUntouched();
    this.expanded.update((value) => !value);
  }

  protected save(): void {
    if (this.saving() || this.disabled()) return;

    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { weight, reps, rpe, note } = this.form.getRawValue();
    if (weight === null || reps === null) return;

    this.error.set('');
    this.saving.set(true);
    this.pendingChange.emit(true);

    this.sessions
      .saveSet(
        this.sessionId(),
        this.exerciseId(),
        this.setNumber(),
        toSaveSetRequest({ weight, reps, rpe, note }),
      )
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
