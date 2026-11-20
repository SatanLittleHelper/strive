import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  type ResourceStatus,
} from '@angular/core';
import {
  SET_RESULT_LIMITS,
  type ExerciseHistoryEntry,
  type SetResult,
} from '@strive/api-interfaces';
import { TuiSwipe, type TuiSwipeEvent } from '@taiga-ui/cdk';
import { TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { getResourceViewState } from '../../api/resource-view-state';
import { ResourceStateComponent } from '../../shared/resource-state';
import { HISTORY_DATE_FORMAT } from '../sessions.constants';

const TIME_FORMAT = 'HH:mm';
const RPE_COLORS = [
  'var(--color-rpe-1)',
  'var(--color-rpe-2)',
  'var(--color-rpe-3)',
  'var(--color-rpe-4)',
  'var(--color-rpe-5)',
];

@Component({
  selector: 'app-exercise-history',
  imports: [DatePipe, NgTemplateOutlet, TuiCardLarge, ResourceStateComponent, TuiTitle, TuiSwipe],
  templateUrl: './exercise-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ExerciseHistoryComponent {
  readonly workoutExerciseId = input.required<number>();
  readonly today = input.required<SetResult[] | null>();
  readonly groups = input.required<ExerciseHistoryEntry[]>();
  readonly status = input.required<ResourceStatus>();
  readonly disabled = input(false);
  readonly fillDisabled = input(false);
  readonly fillSet = output<SetResult>();
  readonly editSet = output<number>();
  readonly retry = output<void>();

  protected readonly viewState = computed(() =>
    getResourceViewState({
      status: this.status(),
      isEmpty: this.groups().length === 0 && this.today() === null,
    }),
  );

  protected readonly dateFormat = HISTORY_DATE_FORMAT;
  protected readonly timeFormat = TIME_FORMAT;
  protected readonly rpeMax = SET_RESULT_LIMITS.rpeMax;

  protected getRpeColor(rpe: number | null): string {
    return rpe === null
      ? 'var(--color-text-muted)'
      : (RPE_COLORS[rpe - 1] ?? 'var(--color-text-muted)');
  }

  protected editToday(event: TuiSwipeEvent, set: SetResult): void {
    // подходы других строк плана с тем же упражнением видны, но правятся на своей строке
    const isOwn = set.workoutExerciseId === this.workoutExerciseId();
    if (this.disabled() || !isOwn || event.direction !== 'left') return;

    this.editSet.emit(set.setNumber);
  }
}
