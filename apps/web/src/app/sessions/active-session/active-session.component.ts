import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiDialogService, TuiLink, TuiNotification, TuiTitle } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { finalize } from 'rxjs';
import { getResourceViewState } from '../../api/resource-view-state';
import { EmptyStateComponent } from '../../shared/empty-state';
import { ErrorStateComponent } from '../../shared/error-state';
import { formatPlan } from '../../workouts/format-plan';
import { countCompletedSets, findResult, SessionsService } from '..';
import { SetRowComponent } from '../set-row';

@Component({
  selector: 'app-active-session',
  imports: [
    RouterLink,
    TuiButton,
    TuiLink,
    TuiNotification,
    TuiTitle,
    TuiCardLarge,
    TuiHeader,
    EmptyStateComponent,
    ErrorStateComponent,
    SetRowComponent,
  ],
  templateUrl: './active-session.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ActiveSessionComponent {
  private readonly sessions = inject(SessionsService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(TuiDialogService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly active = this.sessions.active;
  protected readonly session = computed(() =>
    this.active.hasValue() ? this.active.value().session : null,
  );
  protected readonly state = computed(() =>
    getResourceViewState({ status: this.active.status(), isEmpty: this.session() === null }),
  );
  protected readonly completed = computed(() => {
    const session = this.session();
    return session ? countCompletedSets(session) : 0;
  });
  protected readonly exercises = computed(
    () =>
      this.session()?.workout.exercises.map((item) => ({
        ...item,
        setNumbers: Array.from({ length: item.sets }, (_, index) => index + 1),
      })) ?? [],
  );
  protected readonly total = computed(() =>
    this.exercises().reduce((total, item) => total + item.sets, 0),
  );
  protected readonly finishing = signal(false);
  protected readonly confirming = signal(false);
  protected readonly pendingSaves = signal(0);
  protected readonly error = signal('');
  protected readonly formatPlan = formatPlan;
  protected readonly findResult = findResult;

  constructor() {
    // Возврат через роутер должен перечитать сервер даже у уже созданного singleton-сервиса.
    this.active.reload();
  }

  protected pendingChange(pending: boolean): void {
    this.pendingSaves.update((count) => count + (pending ? 1 : -1));
  }

  protected requestFinish(): void {
    if (this.finishing() || this.confirming() || this.pendingSaves() > 0) return;
    if (this.completed() >= this.total()) {
      this.finish();
      return;
    }

    this.confirming.set(true);
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label: 'Завершить тренировку?',
        data: {
          content: 'Не все подходы выполнены. Сохранённые результаты останутся в истории.',
          yes: 'Завершить',
          no: 'Продолжить тренировку',
        },
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.confirming.set(false)),
      )
      .subscribe((confirmed) => {
        if (confirmed) this.finish();
      });
  }

  private finish(): void {
    const session = this.session();
    if (!session || this.finishing() || this.pendingSaves() > 0) return;

    this.finishing.set(true);
    this.error.set('');

    this.sessions
      .finish(session.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.finishing.set(false)),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/history');
        },
        error: () => this.error.set('Не удалось завершить тренировку. Попробуйте ещё раз.'),
      });
  }
}
