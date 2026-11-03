import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiCell, TuiLink, TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { getResourceViewState } from '../../api/resource-view-state';
import { SessionsService } from '../../sessions';
import { EmptyStateComponent } from '../../shared/empty-state';
import { ErrorStateComponent } from '../../shared/error-state';
import { formatDuration, formatVolume } from '../format-session-summary';
import { MISSING_SESSION_STATUSES, SESSION_DATE_FORMAT, SKELETON_ROWS } from '../history.constants';

@Component({
  selector: 'app-history-details',
  imports: [
    DatePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    RouterLink,
    TuiBadge,
    TuiCardLarge,
    TuiCell,
    TuiHeader,
    TuiLink,
    TuiSkeleton,
    TuiTitle,
  ],
  templateUrl: './history-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HistoryDetailsComponent {
  readonly id = input.required<string>();

  protected readonly summary = inject(SessionsService).getSummary(this.id);
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly dateFormat = SESSION_DATE_FORMAT;
  protected readonly formatDuration = formatDuration;
  protected readonly formatVolume = formatVolume;

  // у одной тренировки «пусто» невозможно: без значения страница либо грузится, либо в ошибке
  protected readonly state = computed(() =>
    getResourceViewState({ status: this.summary.status(), isEmpty: !this.summary.hasValue() }),
  );

  protected readonly notFound = computed(() => {
    const error = this.summary.error();

    return error instanceof HttpErrorResponse && MISSING_SESSION_STATUSES.includes(error.status);
  });
}
