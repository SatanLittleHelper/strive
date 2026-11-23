import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiTitle } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import type { HomeWorkout } from '@strive/api-interfaces';
import { formatExerciseCount } from '../../workouts';

@Component({
  selector: 'app-next-workout',
  imports: [RouterLink, TuiBadge, TuiCardLarge, TuiHeader, TuiTitle],
  templateUrl: './next-workout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class NextWorkoutComponent {
  readonly workout = input.required<HomeWorkout>();
  protected readonly exerciseCount = computed(() =>
    formatExerciseCount(this.workout().exerciseCount),
  );
}
