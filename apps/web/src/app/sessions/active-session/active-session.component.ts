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
import { Location, ViewportScroller } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TuiSwipe, type TuiSwipeEvent } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiDataList,
  TuiDialogService,
  TuiDropdown,
  TuiLink,
  TuiNotification,
  TuiTitle,
} from '@taiga-ui/core';
import { TUI_CONFIRM, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { finalize, interval, Subject, take, takeUntil, type Observable } from 'rxjs';
import { getResourceViewState } from '../../api/resource-view-state';
import { EmptyStateComponent } from '../../shared/empty-state';
import { ErrorStateComponent } from '../../shared/error-state';
import {
  shareLink,
  getEditorSet,
  getFirstUnfinishedExerciseIndex,
  getPrimaryAction,
  getSwipeStep,
  getSupersetIndexes,
  isSessionDone,
  FIRST_NAVIGATION_ID,
  NO_EDITOR_SET,
  SessionsService,
  getAdvanceTarget,
  type EditorSet,
  type PendingAdvance,
  type SavedSetEvent,
} from '..';
import { ExerciseStepComponent } from '../exercise-step';
import { SET_FORM_ID } from '../set-editor';
import { SessionProgressComponent } from '../session-progress';

const AUTO_ADVANCE_SECONDS = 3;
const TICK_MS = 1000;

@Component({
  selector: 'app-active-session',
  imports: [
    RouterLink,
    TuiButton,
    TuiDataList,
    TuiDropdown,
    TuiLink,
    TuiNotification,
    TuiTitle,
    TuiHeader,
    TuiSwipe,
    SessionProgressComponent,
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
  private readonly location = inject(Location);
  private readonly dialogs = inject(TuiDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewport = inject(ViewportScroller);
  private readonly advanceCancelled = new Subject<void>();

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

  // выбор подхода для правки живёт, пока открыто текущее упражнение
  protected readonly selectedSet = linkedSignal<number | null, number | null>({
    source: () => this.currentExercise()?.id ?? null,
    computation: () => null,
  });
  protected readonly editorSet = computed<EditorSet>(() => {
    const exercise = this.currentExercise();
    const session = this.session();
    if (!exercise || !session) return NO_EDITOR_SET;

    return getEditorSet({
      exercise,
      results: session.results,
      selected: this.selectedSet(),
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
  protected readonly historyStatus = computed(() => this.sessions.history.status());
  protected readonly finishing = signal(false);
  protected readonly confirming = signal(false);
  protected readonly pendingSaves = signal(0);
  protected readonly error = signal('');
  protected readonly sharing = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly shareNotice = signal('');
  protected readonly shareError = signal('');
  // просроченная локальная ссылка считается отсутствующей: нажатие снова выпустит её
  protected readonly hasShare = computed(() => {
    const share = this.session()?.share ?? null;

    return share !== null && Date.parse(share.expiresAt) > Date.now();
  });
  protected readonly advanceSeconds = AUTO_ADVANCE_SECONDS;
  protected readonly pendingAdvance = signal<PendingAdvance | null>(null);
  protected readonly pendingAdvanceName = computed(() => {
    const pending = this.pendingAdvance();

    return pending ? (this.exercises()[pending.target]?.exercise.name ?? '') : '';
  });

  constructor() {
    // Возврат через роутер должен перечитать сервер даже у уже созданного singleton-сервиса.
    this.active.reload();
  }

  // смена упражнения возвращает страницу к началу
  private selectExercise(index: number): void {
    this.currentIndex.set(index);
    this.viewport.scrollToPosition([0, 0]);
  }

  protected reloadHistory(): void {
    this.sessions.history.reload();
  }

  protected pendingChange(pending: boolean): void {
    this.pendingSaves.update((count) => count + (pending ? 1 : -1));
  }

  protected onSaved({ setNumber, resultsBefore }: SavedSetEvent): void {
    this.selectedSet.set(null);
    this.cancelAdvance();

    const currentIndex = this.currentIndex();
    const target = getAdvanceTarget({
      exercises: this.exercises(),
      resultsBefore,
      currentIndex,
      savedSetNumber: setNumber,
    });
    if (target === null) return;

    // суперсет переключается сразу; busy ещё держит сохранение, поэтому индекс меняется напрямую
    if (getSupersetIndexes({ exercises: this.exercises(), index: currentIndex }).length > 0) {
      this.selectExercise(target);
      return;
    }

    this.startAdvance(target);
  }

  protected selectSet(setNumber: number): void {
    this.cancelAdvance();
    this.selectedSet.set(setNumber);
  }

  protected cancelAdvance(): void {
    this.advanceCancelled.next();
    this.pendingAdvance.set(null);
  }

  private startAdvance(target: number): void {
    this.pendingAdvance.set({ target, secondsLeft: AUTO_ADVANCE_SECONDS });

    interval(TICK_MS)
      .pipe(
        take(AUTO_ADVANCE_SECONDS),
        takeUntil(this.advanceCancelled),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tick) => {
        const secondsLeft = AUTO_ADVANCE_SECONDS - tick - 1;
        if (secondsLeft > 0) {
          this.pendingAdvance.set({ target, secondsLeft });
          return;
        }

        this.pendingAdvance.set(null);
        this.selectExercise(target);
      });
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
    if (target instanceof Element && target.closest('input, textarea, [data-set-row]')) return;

    this.moveBy(event.direction);
  }

  // первая навигация приложения — прямой заход на экран: назад по истории выйдет из приложения
  protected goBack(): void {
    const navigationId: unknown = history.state?.navigationId;
    if (typeof navigationId === 'number' && navigationId > FIRST_NAVIGATION_ID) {
      this.location.back();

      return;
    }

    void this.router.navigateByUrl('/workouts');
  }

  protected requestFinish(): void {
    if (this.busy()) return;
    this.cancelAdvance();
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
    const index = this.currentIndex();
    const next = getSwipeStep({ index, count: this.exercises().length, direction });
    if (next === index) return;

    this.cancelAdvance();
    this.selectExercise(next);
  }

  // с активной ссылкой нажатие открывает меню, поэтому здесь только первый выпуск
  protected onShareClick(): void {
    if (this.hasShare()) return;

    this.share();
  }

  // отправка из меню идёт синхронно, в жесте пользователя: Web Share не работает после await
  protected shareIssued(): void {
    // TODO: ссылка может быть отозвана в другой вкладке, перечитывать active перед отправкой
    const issued = this.session()?.share ?? null;
    this.menuOpen.set(false);
    this.clearShareMessages();

    if (issued !== null) void this.deliver(issued.token);
  }

  protected revokeShare(): void {
    const session = this.session();
    this.menuOpen.set(false);
    if (!session || this.sharing()) return;

    this.runShareAction({
      request: this.sessions.revokeShare(session.id),
      onNext: () => this.shareNotice.set('Ссылка отозвана'),
      errorText: 'Не удалось отозвать ссылку. Попробуйте ещё раз.',
    });
  }

  private share(): void {
    const session = this.session();
    if (!session || this.sharing()) return;

    this.runShareAction({
      request: this.sessions.share(session.id),
      onNext: (link) => void this.deliver(link.token),
      errorText: 'Не удалось создать ссылку. Попробуйте ещё раз.',
    });
  }

  private runShareAction<T>({
    request,
    onNext,
    errorText,
  }: {
    request: Observable<T>;
    onNext: (value: T) => void;
    errorText: string;
  }): void {
    this.sharing.set(true);
    this.clearShareMessages();

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.sharing.set(false)),
      )
      .subscribe({ next: onNext, error: () => this.shareError.set(errorText) });
  }

  private clearShareMessages(): void {
    this.shareNotice.set('');
    this.shareError.set('');
  }

  private async deliver(token: string): Promise<void> {
    const outcome = await shareLink({ token });

    if (outcome === 'copied') this.shareNotice.set('Ссылка скопирована');
    else if (outcome === 'failed') {
      // ссылка уже выдана: следующее нажатие откроет меню, где «Поделиться» сработает в жесте
      this.shareError.set(
        'Не удалось поделиться ссылкой. Нажмите на кнопку и выберите «Поделиться».',
      );
    }
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
        next: (finished) => {
          void this.router.navigateByUrl(`/history/${finished.id}`);
        },
        error: () => this.error.set('Не удалось завершить тренировку. Попробуйте ещё раз.'),
      });
  }
}
