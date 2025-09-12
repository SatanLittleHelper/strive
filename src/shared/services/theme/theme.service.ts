import { Injectable, computed, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey: string = 'theme';
  private readonly currentTheme = signal<Theme>(this.getInitialTheme());

  public readonly theme = this.currentTheme.asReadonly();
  public readonly isDark = computed<boolean>(() => this.theme() === 'dark');

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  public setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    this.storeTheme(theme);
  }

  public toggleTheme(): void {
    const next: Theme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
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
  }

  private storeTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
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
