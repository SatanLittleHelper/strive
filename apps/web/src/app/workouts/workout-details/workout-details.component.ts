import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiCell, TuiLink, TuiTitle } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { getResourceViewState } from '../../api/resource-view-state';
import { EmptyStateComponent } from '../../shared/empty-state';
import { ErrorStateComponent } from '../../shared/error-state';
import { formatPlan } from '../format-plan';
import { MISSING_WORKOUT_STATUSES, SKELETON_ROWS } from '../workouts.constants';
import { WorkoutsService } from '../workouts.service';

@Component({
  selector: 'app-workout-details',
  imports: [
    EmptyStateComponent,
    ErrorStateComponent,
    RouterLink,
    TuiButton,
    TuiCardLarge,
    TuiCell,
    TuiHeader,
    TuiLink,
    TuiSkeleton,
    TuiTitle,
  ],
  templateUrl: './workout-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class WorkoutDetailsComponent {
  readonly id = input.required<string>();

  protected readonly workout = inject(WorkoutsService).getDetails(this.id);
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly formatPlan = formatPlan;

  // у одной тренировки «пусто» невозможно: без значения страница либо грузится, либо в ошибке
  protected readonly state = computed(() =>
    getResourceViewState({ status: this.workout.status(), isEmpty: !this.workout.hasValue() }),
  );

  protected readonly notFound = computed(() => {
    const error = this.workout.error();

    return error instanceof HttpErrorResponse && MISSING_WORKOUT_STATUSES.includes(error.status);
  });
}
