import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiTitle } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import type { WorkoutSummary } from '@strive/api-interfaces';
import { formatExerciseCount } from '../format-exercise-count';

@Component({
  selector: 'app-workout-card',
  imports: [RouterLink, TuiBadge, TuiCardLarge, TuiHeader, TuiTitle],
  templateUrl: './workout-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class WorkoutCardComponent {
  readonly workout = input.required<WorkoutSummary>();

  protected readonly exerciseCount = computed(() =>
    formatExerciseCount(this.workout().exerciseCount),
  );
}
