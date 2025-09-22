import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge, of } from 'rxjs';
import { filter, switchMap, tap, map } from 'rxjs/operators';
import type { Observable } from 'rxjs';

export interface SyncableData<T = unknown> {
  key: string;
  data: T;
  syncFn: (data: T) => Observable<unknown>;
}

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly onlineStatus = signal<boolean>(navigator.onLine);
  private readonly pendingSyncs = new Map<string, SyncableData<unknown>>();

  public readonly isOnline = this.onlineStatus.asReadonly();

  constructor() {
    this.initializeNetworkMonitoring();
  }

  public syncData<T = unknown>(
    key: string,
    data: T,
    syncFn: (data: T) => Observable<unknown>,
  ): void {
    const syncableData: SyncableData<T> = { key, data, syncFn };

    if (!this.onlineStatus()) {
      this.storePendingSync(syncableData);
      return;
    }

    this.executeSync(syncableData);
  }

  private initializeNetworkMonitoring(): void {
    merge(fromEvent(window, 'online'), fromEvent(window, 'offline'))
      .pipe(
        tap(() => this.onlineStatus.set(navigator.onLine)),
        filter(() => navigator.onLine),
        switchMap(() => this.syncAllPendingData()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private storePendingSync<T>(syncableData: SyncableData<T>): void {
    this.pendingSyncs.set(syncableData.key, syncableData as SyncableData<unknown>);
  }

  private clearPendingSync(key: string): void {
    this.pendingSyncs.delete(key);
  }

  private executeSync<T>(syncableData: SyncableData<T>): Observable<void> {
    return syncableData.syncFn(syncableData.data).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => this.clearPendingSync(syncableData.key)),
      map(() => void 0),
    );
  }

  private syncAllPendingData(): Observable<void> {
    const pendingData = Array.from(this.pendingSyncs.values());

    if (pendingData.length === 0) {
      return of(void 0);
    }

    const syncObservables = pendingData.map((syncableData) => this.executeSync(syncableData));

    return merge(...syncObservables).pipe(map(() => void 0));
  }
}
