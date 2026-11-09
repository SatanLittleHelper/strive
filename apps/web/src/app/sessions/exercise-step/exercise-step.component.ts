import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  ExerciseHistory,
  SetResult,
  WorkoutExercise,
  WorkoutSession,
} from '@strive/api-interfaces';
import { TuiButton, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import {
  canAddSet,
  countExerciseSets,
  findResult,
  getHistoryGroups,
  getRingMax,
  getSetDefaults,
  getTodayGroup,
  toFormValues,
  type EditorSet,
  type SavedSetEvent,
} from '..';
import { ExerciseHistoryComponent } from '../exercise-history';
import type { FillRequest } from '../session-form.types';
import type { ActiveEditorSet } from '../session-view.types';
import { SetEditorComponent } from '../set-editor';
import { SetRingsComponent } from '../set-rings';

@Component({
  selector: 'app-exercise-step',
  imports: [
    TuiButton,
    TuiCardLarge,
    TuiTitle,
    ExerciseHistoryComponent,
    SetEditorComponent,
    SetRingsComponent,
  ],
  templateUrl: './exercise-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ExerciseStepComponent {
  readonly session = input.required<WorkoutSession>();
  readonly item = input.required<WorkoutExercise>();
  readonly history = input<ExerciseHistory>();
  readonly historyLoaded = input(false);
  readonly editorSet = input.required<EditorSet>();
  readonly disabled = input(false);
  readonly pendingChange = output<boolean>();
  readonly saved = output<SavedSetEvent>();
  readonly selectSet = output<number>();
  readonly addSet = output<void>();

  protected readonly fillRequest = signal<FillRequest | null>(null);

  private readonly resultsParams = computed(() => ({
    exercise: this.item(),
    results: this.session().results,
  }));

  protected readonly savedCount = computed(() => countExerciseSets(this.resultsParams()));
  protected readonly ringMax = computed(() => getRingMax(this.resultsParams()));
  protected readonly canAdd = computed(() => canAddSet(this.resultsParams()));
  protected readonly today = computed(() => getTodayGroup(this.resultsParams()));
  protected readonly groups = computed(() => getHistoryGroups(this.history()));
  protected readonly formSet = computed<ActiveEditorSet | null>(() => {
    const set = this.editorSet();

    return set.mode === 'none' ? null : set;
  });
  protected readonly defaults = computed(() => {
    const set = this.formSet();

    return set
      ? getSetDefaults({
          exercise: this.item(),
          setNumber: set.setNumber,
          results: this.session().results,
          history: this.history(),
        })
      : null;
  });
  protected readonly savedResult = computed(() => {
    const set = this.formSet();

    return set
      ? findResult({
          session: this.session(),
          workoutExerciseId: this.item().id,
          setNumber: set.setNumber,
        })
      : undefined;
  });

  protected applyHistory(set: SetResult): void {
    const editor = this.formSet();
    if (this.disabled() || editor === null) return;

    this.fillRequest.set({
      setNumber: editor.setNumber,
      values: { ...toFormValues(set), note: '' },
    });
  }
}
