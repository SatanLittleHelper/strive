import { inject, Injectable, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, tap } from 'rxjs';
import type { Theme } from '@/shared/lib/types';
import { OfflineSyncService, type SyncableData } from '@/shared/services/offline-sync';
import { UserApiService } from '@/shared/services/user';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey: string = 'theme';
  private readonly userApi = inject(UserApiService);
  private readonly offlineSync = inject(OfflineSyncService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentTheme = signal<Theme>(this.getInitialTheme());
  private readonly themeChangeSubject = new Subject<Theme>();

  public readonly theme = this.currentTheme.asReadonly();
  public readonly isDark = computed<boolean>(() => this.theme() === 'dark');

  constructor() {
    this.initializeDebounce();
  }

  public setTheme(theme: Theme, syncWithServer: boolean = true): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    this.storeTheme(theme);

    if (syncWithServer) {
      this.themeChangeSubject.next(theme);
    }
  }

  public toggleTheme(): void {
    const next: Theme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  public initialize(): void {
    this.applyTheme(this.currentTheme());
  }

  private initializeDebounce(): void {
    this.themeChangeSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((theme: Theme) => this.syncWithServer(theme)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private syncWithServer(theme: Theme): void {
    const themeSyncData: SyncableData<Theme> = {
      key: 'theme',
      data: theme,
      syncFn: (data: Theme) => this.userApi.updateTheme$({ theme: data }),
    };

    this.offlineSync.syncData(themeSyncData.key, themeSyncData.data, themeSyncData.syncFn);
  }

  private getInitialTheme(): Theme {
    const saved = this.readStoredTheme();
    if (saved) {
      return saved;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('tuiTheme', theme);
    this.updateThemeColor(theme);
  }

  private updateThemeColor(theme: Theme): void {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      const color = theme === 'dark' ? '#0f172a' : '#ffffff';
      themeColorMeta.setAttribute('content', color);
    }
  }

  private storeTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {}
  }

  private readStoredTheme(): Theme | null {
    try {
      const val = localStorage.getItem(this.storageKey);
      return val === 'light' || val === 'dark' ? val : null;
    } catch {
      return null;
    }
  }
}
