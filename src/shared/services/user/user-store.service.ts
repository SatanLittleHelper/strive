import { inject, Injectable, signal, computed } from '@angular/core';
import { tap, catchError, of } from 'rxjs';
import type { User } from '@/shared/lib/types';
import { UserApiService } from './user-api.service';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private readonly userApi = inject(UserApiService);

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);

  fetchUser$(): Observable<User | null> {
    return this.userApi.getMe$().pipe(
      tap((user) => {
        this.user.set(user);
      }),
      catchError(() => {
        this.user.set(null);
        return of(null);
      }),
    );
  }

  clearUser(): void {
    this.user.set(null);
  }
}
