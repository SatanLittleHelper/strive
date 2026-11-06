import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TuiSwipe, type TuiSwipeEvent } from '@taiga-ui/cdk';
import { TuiButton, TuiDialogService, TuiLink, TuiNotification, TuiTitle } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiProgress, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { finalize } from 'rxjs';
import { getResourceViewState } from '../../api/resource-view-state';
import { EmptyStateComponent } from '../../shared/empty-state';
import { ErrorStateComponent } from '../../shared/error-state';
import {
  getEditorSet,
  getFirstUnfinishedExerciseIndex,
  getPrimaryAction,
  getSwipeStep,
  isExerciseDone,
  isSessionDone,
  NO_EDITOR_SET,
  SessionsService,
  shouldAdvanceAfterSave,
  type EditorSet,
  type SavedSetEvent,
} from '..';
import { ExerciseStepComponent } from '../exercise-step';
import { SET_FORM_ID } from '../set-editor';

@Component({
  selector: 'app-active-session',
  imports: [
    RouterLink,
    TuiButton,
    TuiLink,
    TuiNotification,
    TuiTitle,
    TuiHeader,
    TuiSwipe,
    TuiProgress,
    TuiCardLarge,
    TuiSkeleton,
    EmptyStateComponent,
    ErrorStateComponent,
    ExerciseStepComponent,
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

  protected readonly formId = SET_FORM_ID;
  protected readonly active = this.sessions.active;
  protected readonly session = computed(() =>
    this.active.hasValue() ? this.active.value().session : null,
  );
  protected readonly state = computed(() =>
    getResourceViewState({ status: this.active.status(), isEmpty: this.session() === null }),
  );
  protected readonly exercises = computed(() => this.session()?.workout.exercises ?? []);
  protected readonly currentIndex = linkedSignal<number | null, number>({
    source: () => this.session()?.id ?? null,
    computation: (sessionId, previous) => {
      // Сохранение обновляет сессию, но не должно сбрасывать выбранное упражнение.
      if (previous?.source === sessionId) return previous.value;

      const session = untracked(() => this.session());

      return session ? getFirstUnfinishedExerciseIndex(session) : 0;
    },
  });
  protected readonly currentExercise = computed(() => this.exercises()[this.currentIndex()]);
  protected readonly isLastExercise = computed(
    () => this.currentIndex() >= this.exercises().length - 1,
  );
  protected readonly sessionDone = computed(() => {
    const session = this.session();

    return session ? isSessionDone(session) : false;
  });
  protected readonly completedExercises = computed(() => {
    const session = this.session();
    if (!session) return 0;

    return this.exercises().filter((exercise) =>
      isExerciseDone({ exercise, results: session.results }),
    ).length;
  });

  // выбор подхода для правки и запрос добавления живут, пока открыто текущее упражнение
  protected readonly selectedSet = linkedSignal<number | null, number | null>({
    source: () => this.currentExercise()?.exercise.id ?? null,
    computation: () => null,
  });
  protected readonly adding = linkedSignal<number | null, boolean>({
    source: () => this.currentExercise()?.exercise.id ?? null,
    computation: () => false,
  });
  protected readonly editorSet = computed<EditorSet>(() => {
    const exercise = this.currentExercise();
    const session = this.session();
    if (!exercise || !session) return NO_EDITOR_SET;

    return getEditorSet({
      exercise,
      results: session.results,
      selected: this.selectedSet(),
      adding: this.adding(),
    });
  });
  protected readonly primaryAction = computed(() =>
    getPrimaryAction({
      hasForm: this.editorSet().mode !== 'none',
      isLastExercise: this.isLastExercise(),
      sessionDone: this.sessionDone(),
    }),
  );
  protected readonly primaryLabel = computed(() => {
    const action = this.primaryAction();
    if (action === 'next') return 'Следующее упражнение';
    if (action === 'finish') return 'Завершить тренировку';

    return this.editorSet().mode === 'edit' ? 'Сохранить изменения' : 'Сохранить подход';
  });

  protected readonly busy = computed(
    () => this.finishing() || this.confirming() || this.pendingSaves() > 0,
  );
  protected readonly histories = computed(() => {
    const history = this.sessions.history;

    return new Map(
      (history.hasValue() ? history.value().exercises : []).map((item) => [item.exerciseId, item]),
    );
  });
  protected readonly historyLoaded = computed(() => this.sessions.history.hasValue());
  protected readonly finishing = signal(false);
  protected readonly confirming = signal(false);
  protected readonly pendingSaves = signal(0);
  protected readonly error = signal('');

  constructor() {
    // Возврат через роутер должен перечитать сервер даже у уже созданного singleton-сервиса.
    this.active.reload();
  }

  protected pendingChange(pending: boolean): void {
    this.pendingSaves.update((count) => count + (pending ? 1 : -1));
  }

  protected onSaved({ setNumber, resultsBefore }: SavedSetEvent): void {
    const exercise = this.currentExercise();
    this.selectedSet.set(null);
    this.adding.set(false);
    if (!exercise) return;

    const advance = shouldAdvanceAfterSave({
      exercise,
      resultsBefore,
      savedSetNumber: setNumber,
      isLastExercise: this.isLastExercise(),
    });
    // busy ещё держит сохранение (finalize идёт после next), поэтому индекс меняется напрямую
    if (advance) this.moveBy('left');
  }

  protected go(direction: 'left' | 'right'): void {
    if (this.busy()) return;

    this.moveBy(direction);
  }

  protected runPrimary(): void {
    const action = this.primaryAction();
    if (action === 'next') this.go('left');
    else if (action === 'finish') this.requestFinish();
  }

  protected onSwipe(event: TuiSwipeEvent): void {
    if (this.busy()) return;

    const target = event.events[0]?.target;
    if (target instanceof Element && target.closest('input, textarea')) return;

    this.moveBy(event.direction);
  }

  protected requestFinish(): void {
    if (this.busy()) return;
    if (this.sessionDone()) {
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

  private moveBy(direction: 'left' | 'right' | 'top' | 'bottom'): void {
    this.currentIndex.update((index) =>
      getSwipeStep({ index, count: this.exercises().length, direction }),
    );
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
