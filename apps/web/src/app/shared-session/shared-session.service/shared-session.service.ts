import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { computed, inject, Service } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import type { SharedSessionResponse } from '@strive/api-interfaces';
import { catchError, exhaustMap, map, of, scan, switchMap, takeWhile, timer } from 'rxjs';
import type { Observable } from 'rxjs';
import { API_URL_PREFIX } from '../../api/api.constants';
import type { PollResult, SharedSessionWatch, SharedState } from '../shared-session.types';

const SHARED_URL = `${API_URL_PREFIX}/shared`;
const POLL_INTERVAL_MS = 5000;
const INITIAL_STATE: SharedState = { session: null, status: 'loading', offline: false };

function isInvalidLink(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === HttpStatusCode.NotFound;
}

function isTerminal(result: PollResult): boolean {
  if (result.type === 'invalid') return true;

  return result.type === 'session' && result.session.finishedAt !== null;
}

function reduceState(state: SharedState, result: PollResult): SharedState {
  if (result.type === 'session')
    return { session: result.session, status: 'ready', offline: false };
  if (result.type === 'invalid') return { ...state, status: 'invalid', offline: false };

  return { ...state, offline: true };
}

@Service()
export class SharedSessionService {
  private readonly http = inject(HttpClient);

  // вызывается в контексте внедрения: опрос живёт, пока жив вызывающий компонент
  watch(token: () => string): SharedSessionWatch {
    const state = toSignal(
      toObservable(computed(token)).pipe(
        switchMap((current) =>
          timer(0, POLL_INTERVAL_MS).pipe(
            exhaustMap(() => this.poll(current)),
            takeWhile((result) => !isTerminal(result), true),
          ),
        ),
        scan(reduceState, INITIAL_STATE),
      ),
      { initialValue: INITIAL_STATE },
    );

    return {
      session: computed(() => state().session),
      status: computed(() => state().status),
      offline: computed(() => state().offline),
    };
  }

  private poll(token: string): Observable<PollResult> {
    return this.http.get<SharedSessionResponse>(`${SHARED_URL}/${encodeURIComponent(token)}`).pipe(
      map((response): PollResult => ({ type: 'session', session: response })),
      catchError((error: unknown) =>
        of<PollResult>(isInvalidLink(error) ? { type: 'invalid' } : { type: 'offline' }),
      ),
    );
  }
}
