import { inject, Injectable, signal, computed } from '@angular/core';
import { tap, catchError, of, map } from 'rxjs';
import { UserApiService } from '@/shared';
import type { User } from '@/shared/lib/types';
import { ThemeService } from '@/shared/services/theme';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private readonly userApi = inject(UserApiService);
  private readonly themeService = inject(ThemeService);

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);

  fetchUser$(): Observable<void> {
    return this.userApi.getMe$().pipe(
      tap((user) => {
        this.user.set(user);
        if (user?.theme) {
          this.themeService.setTheme(user.theme, false);
        }
      }),
      catchError(() => {
        this.user.set(null);
        return of(void 0);
      }),
      map(() => void 0),
    );
  }

  clearUser(): void {
    this.user.set(null);
  }
}
