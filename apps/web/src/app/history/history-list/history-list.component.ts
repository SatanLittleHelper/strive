import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { getResourceViewState } from '../../api/resource-view-state';
import { SessionsService } from '../../sessions';
import { EmptyStateComponent } from '../../shared/empty-state';
import { ErrorStateComponent } from '../../shared/error-state';
import { formatSessionSummary } from '../format-session-summary';
import { SESSION_DATE_FORMAT, SKELETON_ROWS } from '../history.constants';

@Component({
  selector: 'app-history-list',
  imports: [
    DatePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    RouterLink,
    TuiBadge,
    TuiCardLarge,
    TuiHeader,
    TuiSkeleton,
    TuiTitle,
  ],
  templateUrl: './history-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HistoryListComponent {
  protected readonly sessions = inject(SessionsService).getFinished();
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly dateFormat = SESSION_DATE_FORMAT;
  protected readonly formatSessionSummary = formatSessionSummary;

  protected readonly state = computed(() =>
    getResourceViewState({
      status: this.sessions.status(),
      isEmpty: !this.sessions.hasValue() || this.sessions.value().sessions.length === 0,
    }),
  );
}
