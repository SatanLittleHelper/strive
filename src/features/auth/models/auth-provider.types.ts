import type { LoginRequest, RegisterRequest, LoginResponse } from './auth.types';
import type { Observable } from 'rxjs';

export interface AuthProvider {
  readonly name: string;

  login$(credentials: LoginRequest): Observable<LoginResponse>;
  register$(data: RegisterRequest): Observable<void>;
  refresh$(): Observable<LoginResponse>;
  logout$(): Observable<void>;
}

export interface AuthProviderConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}
