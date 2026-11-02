import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  ExerciseHistory,
  SetResult,
  WorkoutExercise,
  WorkoutSession,
} from '@strive/api-interfaces';
import { TuiCell, TuiTitle } from '@taiga-ui/core';
import { TuiAccordion } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { formatPlan } from '../../workouts/format-plan';
import { findResult, getActiveSetNumber, getSetDefaults, toFormValues } from '..';
import type { FillRequest } from '../session-form.types';
import { SetRowComponent } from '../set-row';

@Component({
  selector: 'app-exercise-step',
  imports: [DatePipe, TuiTitle, TuiCell, TuiCardLarge, TuiAccordion, SetRowComponent],
  templateUrl: './exercise-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ExerciseStepComponent {
  readonly session = input.required<WorkoutSession>();
  readonly item = input.required<WorkoutExercise>();
  readonly history = input<ExerciseHistory>();
  readonly disabled = input(false);
  readonly pendingChange = output<boolean>();

  protected readonly formatPlan = formatPlan;

  protected readonly activeSetNumber = computed(() =>
    getActiveSetNumber({ exercise: this.item(), results: this.session().results }),
  );

  protected readonly rows = computed(() => {
    const item = this.item();
    const session = this.session();
    const active = this.activeSetNumber();

    return Array.from({ length: item.sets }, (_, index) => index + 1).map((setNumber) => ({
      setNumber,
      open: setNumber === active,
      result: findResult(session, item.exercise.id, setNumber),
      defaults: getSetDefaults({
        exercise: item,
        setNumber,
        results: session.results,
        history: this.history(),
      }),
    }));
  });
  protected readonly fillRequest = signal<FillRequest | null>(null);

  protected applyHistory(set: SetResult): void {
    const setNumber = this.activeSetNumber();
    if (this.disabled() || setNumber === null) return;

    this.fillRequest.set({ setNumber, values: toFormValues(set) });
  }
}
