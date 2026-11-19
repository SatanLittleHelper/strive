import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { getResourceViewState, type ResourceViewState } from '../../api/resource-view-state';
import { SessionsService } from '../../sessions';
import { ResourceStateComponent } from '../../shared/resource-state';
import { formatExerciseCount, WorkoutsService } from '../../workouts';
import { getNextWorkout } from './next-workout.helpers';

@Component({
  selector: 'app-next-workout',
  imports: [
    ResourceStateComponent,
    RouterLink,
    TuiBadge,
    TuiCardLarge,
    TuiHeader,
    TuiSkeleton,
    TuiTitle,
  ],
  templateUrl: './next-workout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class NextWorkoutComponent {
  private readonly workouts = inject(WorkoutsService).getList();
  private readonly finished = inject(SessionsService).getFinished();

  protected readonly state = computed<ResourceViewState>(() => {
    const catalog = getResourceViewState({
      status: this.workouts.status(),
      isEmpty: !this.workouts.hasValue() || this.workouts.value().length === 0,
    });
    // пустой список завершённых — готовые данные (выбирается первая), а повтор после ошибки без значения — загрузка
    const history = getResourceViewState({
      status: this.finished.status(),
      isEmpty: !this.finished.hasValue(),
    });
    if (catalog === 'error' || history === 'error') return 'error';
    if (catalog === 'loading' || history === 'loading') return 'loading';

    return catalog;
  });
  protected readonly next = computed(() =>
    getNextWorkout({
      workouts: this.workouts.hasValue() ? this.workouts.value() : [],
      finished: this.finished.hasValue() ? this.finished.value().sessions : [],
    }),
  );
  protected readonly exerciseCount = computed(() =>
    formatExerciseCount(this.next()?.exerciseCount ?? 0),
  );

  protected reload(): void {
    this.workouts.reload();
    this.finished.reload();
  }
}
