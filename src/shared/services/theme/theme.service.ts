import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey: string = 'theme';
  private readonly prefersDarkMql: MediaQueryList = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );

  private readonly hasExplicitPreference = signal<boolean>(false);
  private readonly currentTheme = signal<Theme>('light');

  public readonly theme = this.currentTheme.asReadonly();
  public readonly isDark = computed<boolean>(() => this.theme() === 'dark');

  constructor() {
    const destroyRef = inject(DestroyRef);

    const saved = this.readStoredTheme();
    if (saved) {
      this.hasExplicitPreference.set(true);
      this.currentTheme.set(saved);
    } else {
      const systemTheme: Theme = this.prefersDarkMql.matches ? 'dark' : 'light';
      this.currentTheme.set(systemTheme);
    }

    this.applyTheme(this.currentTheme());

    const onChange = (e: MediaQueryListEvent): void => {
      if (!this.hasExplicitPreference()) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        this.currentTheme.set(newTheme);
        this.applyTheme(newTheme);
      }
    };
    this.prefersDarkMql.addEventListener('change', onChange);
    destroyRef.onDestroy((): void => {
      this.prefersDarkMql.removeEventListener('change', onChange);
    });
  }

  public setTheme(theme: Theme): void {
    this.hasExplicitPreference.set(true);
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    this.storeTheme(theme);
  }

  public toggleTheme(): void {
    const next: Theme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private storeTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
      // ignore
    }
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
