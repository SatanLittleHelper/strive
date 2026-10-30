import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TuiTitle } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { getResourceViewState } from '../../api/resource-view-state';
import { EmptyStateComponent } from '../../shared/empty-state';
import { ErrorStateComponent } from '../../shared/error-state';
import { WorkoutCardComponent } from '../workout-card';
import { SKELETON_ROWS } from '../workouts.constants';
import { WorkoutsService } from '../workouts.service';

@Component({
  selector: 'app-workout-list',
  imports: [
    EmptyStateComponent,
    ErrorStateComponent,
    TuiCardLarge,
    TuiHeader,
    TuiSkeleton,
    TuiTitle,
    WorkoutCardComponent,
  ],
  templateUrl: './workout-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class WorkoutListComponent {
  protected readonly workouts = inject(WorkoutsService).getList();
  protected readonly skeletonRows = SKELETON_ROWS;

  // все статусы ресурса (idle/loading/reloading/resolved/local/error) сводятся к четырём состояниям страницы
  protected readonly state = computed(() =>
    getResourceViewState({
      status: this.workouts.status(),
      isEmpty: !this.workouts.hasValue() || this.workouts.value().length === 0,
    }),
  );
}
