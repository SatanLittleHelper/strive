import { HttpClient, httpResource, type HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type {
  ActiveSessionResponse,
  SaveSetResultRequest,
  SessionHistoryResponse,
  SessionListResponse,
  SessionSummary,
  WorkoutSession,
} from '@strive/api-interfaces';
import { tap, type Observable } from 'rxjs';
import { SESSIONS_URL } from '../sessions.constants';

@Service()
export class SessionsService {
  private readonly http = inject(HttpClient);

  readonly active = httpResource<ActiveSessionResponse>(() => `${SESSIONS_URL}/active`);

  readonly history = httpResource<SessionHistoryResponse>(() => {
    const session = this.active.hasValue() ? this.active.value().session : null;

    return session ? `${SESSIONS_URL}/${session.id}/history` : undefined;
  });

  getFinished(): HttpResourceRef<SessionListResponse | undefined> {
    return httpResource<SessionListResponse>(() => SESSIONS_URL);
  }

  getSummary(id: () => string): HttpResourceRef<SessionSummary | undefined> {
    return httpResource<SessionSummary>(
      () => `${SESSIONS_URL}/${encodeURIComponent(id())}/summary`,
    );
  }

  start(workoutId: number): Observable<WorkoutSession> {
    return this.http
      .post<WorkoutSession>(SESSIONS_URL, { workoutId })
      .pipe(tap((session) => this.active.set({ session })));
  }

  saveSet({
    sessionId,
    workoutExerciseId,
    setNumber,
    payload,
  }: {
    sessionId: number;
    workoutExerciseId: number;
    setNumber: number;
    payload: SaveSetResultRequest;
  }): Observable<WorkoutSession> {
    return this.http
      .put<WorkoutSession>(
        `${SESSIONS_URL}/${sessionId}/sets/${workoutExerciseId}/${setNumber}`,
        payload,
      )
      .pipe(tap((session) => this.active.set({ session })));
  }

  finish(sessionId: number): Observable<WorkoutSession> {
    return this.http
      .post<WorkoutSession>(`${SESSIONS_URL}/${sessionId}/finish`, {})
      .pipe(tap(() => this.active.set({ session: null })));
  }
}
