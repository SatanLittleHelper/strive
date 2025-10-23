import { ChangeDetectionStrategy, Component, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { TuiRoot, TuiButton } from '@taiga-ui/core';
import { forkJoin, finalize, catchError, of } from 'rxjs';

import { TelegramService, ThemeService, SwUpdateService, UserStoreService } from '@/shared';
import { NavigationComponent } from '@/widgets';
import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, TuiRoot, TuiButton],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly telegramService = inject(TelegramService);
  private readonly themeService = inject(ThemeService);
  private readonly swUpdateService = inject(SwUpdateService);
  private readonly userStore = inject(UserStoreService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeApp();
  }

  private initializeApp(): void {
    this.loading.set(true);
    this.error.set(null);

    this.telegramService.webApp.ready();
    this.themeService.initialize();
    this.swUpdateService.init();

    const initializationTasks = [this.userStore.fetchUser$()];

    forkJoin(initializationTasks)
      .pipe(
        catchError((error) => {
          console.error('Initialization failed:', error);
          this.error.set('Failed to load application data. Please try again.');
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  retryInitialization(): void {
    this.initializeApp();
  }
}
