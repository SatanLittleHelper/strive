import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import type { VersionReadyEvent } from '@angular/service-worker';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly destroyRef = inject(DestroyRef);
  private readonly abortController = new AbortController();

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.initializeUpdateChecks();
      this.handleUpdates();
      this.setupCleanup();
    }
  }

  private initializeUpdateChecks(): void {
    void this.swUpdate.checkForUpdate();

    const signal = this.abortController.signal;

    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) {
          void this.swUpdate.checkForUpdate();
        }
      },
      { signal },
    );

    window.addEventListener(
      'focus',
      () => {
        void this.swUpdate.checkForUpdate();
      },
      { signal },
    );

    window.addEventListener(
      'load',
      () => {
        void this.swUpdate.checkForUpdate();
      },
      { signal },
    );
  }

  private setupCleanup(): void {
    this.destroyRef.onDestroy(() => {
      this.abortController.abort();
    });
  }

  private handleUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (confirm('New version available. Load new version?')) {
          window.location.reload();
        }
      });
  }
}
