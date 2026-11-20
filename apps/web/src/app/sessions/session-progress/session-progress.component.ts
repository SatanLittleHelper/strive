import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { WorkoutSession } from '@strive/api-interfaces';
import { groupSupersets } from '../../workouts';
import { getExerciseCompletion, getSessionCompletion } from '..';

@Component({
  selector: 'app-session-progress',
  templateUrl: './session-progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SessionProgressComponent {
  readonly session = input.required<WorkoutSession>();
  readonly currentId = input<number | null>(null);

  protected readonly max = computed(() => this.session().workout.exercises.length);
  protected readonly value = computed(() => getSessionCompletion(this.session()));
  protected readonly segments = computed(() => {
    const { workout, results } = this.session();

    return groupSupersets(workout.exercises).map(({ items, superset }) => ({
      superset,
      current: superset && items.some((exercise) => exercise.id === this.currentId()),
      members: items.map((exercise) => ({
        id: exercise.id,
        fill: getExerciseCompletion({ exercise, results }),
        group: exercise.supersetGroup,
      })),
    }));
  });
}
