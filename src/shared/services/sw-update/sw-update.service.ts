import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { fromEvent, merge, EMPTY } from 'rxjs';
import { filter, switchMap, tap, catchError, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly destroyRef = inject(DestroyRef);

  init(): void {
    if (this.swUpdate.isEnabled) {
      this.initializeUpdateChecks();
      this.handleUpdates();
    }
  }

  private initializeUpdateChecks(): void {
    const visibilityChange$ = fromEvent(document, 'visibilitychange').pipe(
      filter(() => !document.hidden),
    );

    const windowFocus$ = fromEvent(window, 'focus');
    const windowLoad$ = fromEvent(window, 'load');

    const triggers$ = merge(EMPTY, visibilityChange$, windowFocus$, windowLoad$).pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    );

    triggers$
      .pipe(
        switchMap(() => this.swUpdate.checkForUpdate()),
        catchError((error) => {
          console.error('Check for update failed:', error);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private handleUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt) => evt.type === 'VERSION_READY'),
        tap(() => {
          if (confirm('New version available. Load new version?')) {
            window.location.reload();
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
