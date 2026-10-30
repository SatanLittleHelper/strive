import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiCell, TuiLink, TuiNotification, TuiTitle } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { finalize } from 'rxjs';
import { getResourceViewState } from '../../api/resource-view-state';
import { SESSION_CONFLICT_STATUS, SessionsService } from '../../sessions';
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
    TuiNotification,
    TuiSkeleton,
    TuiTitle,
  ],
  templateUrl: './workout-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class WorkoutDetailsComponent {
  readonly id = input.required<string>();

  private readonly sessions = inject(SessionsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly starting = signal(false);
  protected readonly startError = signal('');

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

  protected start(): void {
    const workout = this.workout.value();
    if (!workout || this.starting()) return;

    this.starting.set(true);
    this.startError.set('');

    this.sessions
      .start(workout.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.starting.set(false)),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/session');
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === SESSION_CONFLICT_STATUS) {
            void this.router.navigateByUrl('/session');
            return;
          }

          this.startError.set('Не удалось начать тренировку. Попробуйте ещё раз.');
        },
      });
  }
}
