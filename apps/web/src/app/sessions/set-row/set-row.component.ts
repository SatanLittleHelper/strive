import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SET_RESULT_LIMITS, type SetResult } from '@strive/api-interfaces';
import { TuiButton, TuiNotification } from '@taiga-ui/core';
import { TuiBadge, TuiInputNumber, TuiTextarea } from '@taiga-ui/kit';
import { finalize } from 'rxjs';
import { SessionsService, validateSetInput } from '..';

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
  readonly result = input<SetResult>();
  readonly disabled = input(false);
  readonly pendingChange = output<boolean>();

  private readonly sessions = inject(SessionsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly limits = SET_RESULT_LIMITS;
  protected readonly expanded = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly weight = signal<number | null>(null);
  protected readonly reps = signal<number | null>(null);
  protected readonly rpe = signal<number | null>(null);
  protected readonly note = signal('');

  protected toggle(): void {
    if (this.expanded()) {
      this.expanded.set(false);
      return;
    }

    const result = this.result();
    this.weight.set(result?.weight ?? null);
    this.reps.set(result?.reps ?? null);
    this.rpe.set(result?.rpe ?? null);
    this.note.set(result?.note ?? '');
    this.error.set('');
    this.expanded.set(true);
  }

  protected save(): void {
    if (this.saving() || this.disabled()) return;

    const validation = validateSetInput({
      weight: String(this.weight() ?? ''),
      reps: String(this.reps() ?? ''),
      rpe: String(this.rpe() ?? ''),
      note: this.note(),
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
