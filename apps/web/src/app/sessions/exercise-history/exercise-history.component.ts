import { DatePipe } from '@angular/common';
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
import { TuiCell, TuiTitle } from '@taiga-ui/core';
import { TuiProgress } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { getResourceViewState } from '../../api/resource-view-state';
import { ResourceStateComponent } from '../../shared/resource-state';
import { HISTORY_DATE_FORMAT } from '../sessions.constants';

@Component({
  selector: 'app-exercise-history',
  imports: [
    DatePipe,
    TuiCardLarge,
    TuiCell,
    ResourceStateComponent,
    TuiProgress,
    TuiTitle,
    TuiSwipe,
  ],
  templateUrl: './exercise-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ExerciseHistoryComponent {
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
  protected readonly rpeMax = SET_RESULT_LIMITS.rpeMax;

  protected editToday(event: TuiSwipeEvent, setNumber: number): void {
    if (this.disabled() || event.direction !== 'left') return;

    this.editSet.emit(setNumber);
  }
}
