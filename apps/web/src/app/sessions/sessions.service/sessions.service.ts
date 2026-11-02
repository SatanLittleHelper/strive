import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type {
  ActiveSessionResponse,
  SaveSetResultRequest,
  WorkoutSession,
} from '@strive/api-interfaces';
import { tap, type Observable } from 'rxjs';
import { SESSIONS_URL } from '../sessions.constants';

@Service()
export class SessionsService {
  private readonly http = inject(HttpClient);

  readonly active = httpResource<ActiveSessionResponse>(() => `${SESSIONS_URL}/active`);

  start(workoutId: number): Observable<WorkoutSession> {
    return this.http
      .post<WorkoutSession>(SESSIONS_URL, { workoutId })
      .pipe(tap((session) => this.active.set({ session })));
  }

  saveSet(
    sessionId: number,
    exerciseId: number,
    setNumber: number,
    body: SaveSetResultRequest,
  ): Observable<WorkoutSession> {
    return this.http
      .put<WorkoutSession>(`${SESSIONS_URL}/${sessionId}/sets/${exerciseId}/${setNumber}`, body)
      .pipe(tap((session) => this.active.set({ session })));
  }

  finish(sessionId: number): Observable<WorkoutSession> {
    return this.http
      .post<WorkoutSession>(`${SESSIONS_URL}/${sessionId}/finish`, {})
      .pipe(tap(() => this.active.set({ session: null })));
  }
}
