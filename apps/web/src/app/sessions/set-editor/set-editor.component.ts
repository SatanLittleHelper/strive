import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SET_RESULT_LIMITS, type SetResult } from '@strive/api-interfaces';
import { TuiError, TuiLink, TuiNotification } from '@taiga-ui/core';
import { TuiInputNumber, TuiSegmented, TuiTextarea } from '@taiga-ui/kit';
import { finalize } from 'rxjs';
import {
  isSameFormValues,
  SessionsService,
  toFormValues,
  toSaveSetRequest,
  type SetFormValues,
} from '..';
import type { FillRequest } from '../session-form.types';
import type { ActiveEditorSet, SavedSetEvent } from '../session-view.types';
import { RPE_VALUES, WEIGHT_MIN } from '../sessions.constants';
import {
  NOTE_VALIDATORS,
  REPS_VALIDATORS,
  RPE_VALIDATORS,
  WEIGHT_VALIDATORS,
} from '../set-form.validators';
import { SET_ERRORS_PROVIDER, SET_FORM_ID } from './set-editor.constants';

@Component({
  selector: 'app-set-editor',
  imports: [
    ReactiveFormsModule,
    TuiError,
    TuiInputNumber,
    TuiLink,
    TuiNotification,
    TuiSegmented,
    TuiTextarea,
  ],
  templateUrl: './set-editor.component.html',
  providers: [SET_ERRORS_PROVIDER],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SetEditorComponent {
  readonly sessionId = input.required<number>();
  readonly workoutExerciseId = input.required<number>();
  readonly editorSet = input.required<ActiveEditorSet>();
  readonly defaults = input.required<SetFormValues>();
  readonly results = input.required<SetResult[]>();
  readonly result = input<SetResult>();
  readonly fillRequest = input<FillRequest | null>(null);
  readonly disabled = input(false);
  readonly pendingChange = output<boolean>();
  readonly saved = output<SavedSetEvent>();

  private readonly sessions = inject(SessionsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formId = SET_FORM_ID;
  protected readonly limits = SET_RESULT_LIMITS;
  protected readonly weightMin = WEIGHT_MIN;
  protected readonly rpeValues = RPE_VALUES;
  protected readonly saving = signal(false);
  protected readonly noteOpen = signal(false);
  protected readonly error = signal('');
  protected readonly setNumber = computed(() => this.editorSet().setNumber);

  protected readonly form = this.fb.group({
    weight: this.fb.control<number | null>(null, WEIGHT_VALIDATORS),
    reps: this.fb.control<number | null>(null, REPS_VALIDATORS),
    rpe: this.fb.control<number | null>(null, RPE_VALIDATORS),
    note: this.fb.control('', NOTE_VALIDATORS),
  });

  private appliedKey: string | null = null;
  private appliedFill: FillRequest | null = null;
  private appliedValues: SetFormValues | null = null;

  private readonly resetKey = computed(() => `${this.editorSet().mode}:${this.setNumber()}`);

  private readonly initial = computed<SetFormValues>(() => {
    const saved = this.editorSet().mode === 'edit' ? this.result() : undefined;
    if (saved) return toFormValues(saved);

    const fill = this.fillRequest();

    return fill && fill.setNumber === this.setNumber() ? fill.values : this.defaults();
  });

  constructor() {
    // введённое пользователем не затирается пересчётом значений по умолчанию (например, когда
    // приходит история); смена подхода и новый запрос подстановки из истории сбрасывают форму всегда
    effect(() => {
      const values = this.initial();
      const fill = this.fillRequest();
      const key = this.resetKey();

      untracked(() => {
        const edited =
          this.appliedValues !== null &&
          !isSameFormValues(this.form.getRawValue(), this.appliedValues);
        if (key === this.appliedKey && fill === this.appliedFill && edited) return;

        if (key !== this.appliedKey) {
          this.noteOpen.set(values.note !== '');
          this.error.set('');
        }
        this.appliedKey = key;
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

  protected toggleNote(): void {
    this.noteOpen.update((open) => !open);
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

    const setNumber = this.setNumber();
    const resultsBefore = this.results();
    this.saving.set(true);
    this.pendingChange.emit(true);

    this.sessions
      .saveSet({
        sessionId: this.sessionId(),
        workoutExerciseId: this.workoutExerciseId(),
        setNumber,
        payload: toSaveSetRequest({ weight, reps, rpe, note }),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.pendingChange.emit(false);
        }),
      )
      .subscribe({
        next: () => this.saved.emit({ setNumber, resultsBefore }),
        error: () => this.error.set('Не удалось сохранить подход. Попробуйте ещё раз.'),
      });
  }
}
