import { inject, Injectable } from '@angular/core';
import { AuthApiService } from '@/features/auth';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/features/auth';
import type { AuthProvider } from '@/features/auth/models/auth-provider.types';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmailPasswordProvider implements AuthProvider {
  readonly name = 'email-password';

  private readonly authApi = inject(AuthApiService);

  login$(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authApi.login$(credentials);
  }

  register$(data: RegisterRequest): Observable<void> {
    return this.authApi.register$(data);
  }

  refresh$(): Observable<LoginResponse> {
    return this.authApi.refresh$();
  }

  logout$(): Observable<void> {
    return this.authApi.logout$();
  }
}
