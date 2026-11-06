import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  SET_RESULT_LIMITS,
  type ExerciseHistoryEntry,
  type SetResult,
} from '@strive/api-interfaces';
import { TuiCell, TuiNotification, TuiTitle } from '@taiga-ui/core';
import { TuiProgress } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { HISTORY_DATE_FORMAT } from '../sessions.constants';

@Component({
  selector: 'app-exercise-history',
  imports: [DatePipe, TuiCardLarge, TuiCell, TuiNotification, TuiProgress, TuiTitle],
  templateUrl: './exercise-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ExerciseHistoryComponent {
  readonly today = input.required<SetResult[] | null>();
  readonly groups = input.required<ExerciseHistoryEntry[]>();
  readonly loaded = input.required<boolean>();
  readonly disabled = input(false);
  readonly fillDisabled = input(false);
  readonly editSet = output<number>();
  readonly fillSet = output<SetResult>();

  protected readonly dateFormat = HISTORY_DATE_FORMAT;
  protected readonly rpeMax = SET_RESULT_LIMITS.rpeMax;
}
