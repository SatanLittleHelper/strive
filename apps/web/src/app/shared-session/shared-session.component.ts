import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TuiCell, TuiNotification, TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { formatDuration, formatVolume } from '../history/format-session-summary';
import { SKELETON_ROWS } from '../history/history.constants';
import { SessionProgressComponent } from '../sessions/session-progress';
import { EmptyStateComponent } from '../shared/empty-state';
import { toSharedView } from './shared-session.helpers';
import type { SharedExerciseStatus } from './shared-session.types';
import { SharedSessionService } from './shared-session.service';

@Component({
  selector: 'app-shared-session',
  imports: [
    EmptyStateComponent,
    NgTemplateOutlet,
    SessionProgressComponent,
    TuiBadge,
    TuiCardLarge,
    TuiCell,
    TuiHeader,
    TuiNotification,
    TuiSkeleton,
    TuiTitle,
  ],
  templateUrl: './shared-session.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mx-auto block w-full max-w-180 px-4 py-6' },
})
export class SharedSessionComponent {
  readonly token = input.required<string>();

  private readonly watch = inject(SharedSessionService).watch(this.token);

  protected readonly state = this.watch.status;
  protected readonly offline = this.watch.offline;
  protected readonly view = computed(() => {
    const shared = this.watch.session();

    return shared ? toSharedView(shared) : null;
  });
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly formatDuration = formatDuration;
  protected readonly formatVolume = formatVolume;
  protected readonly statusLabel: Record<SharedExerciseStatus, string> = {
    done: 'Завершено',
    current: 'Сейчас',
    todo: 'Не начато',
    skipped: 'Пропущено',
  };
  protected readonly statusAppearance: Record<SharedExerciseStatus, string> = {
    done: 'positive',
    current: 'info',
    todo: 'neutral',
    skipped: 'neutral',
  };

  // переменная let-item в ng-template имеет тип any: обёртки возвращают индексацию к строгим типам
  protected labelFor(status: SharedExerciseStatus): string {
    return this.statusLabel[status];
  }

  protected appearanceFor(status: SharedExerciseStatus): string {
    return this.statusAppearance[status];
  }
}
