import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SessionHistoryResponse, WorkoutSession } from '@strive/api-interfaces';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsService } from './sessions.service';

const SESSION_ID = 42;
const WORKOUT_ID = 2;
const EXERCISE_ID = 3;
const SET_NUMBER = 1;
const RESULT = { weight: 60.25, reps: 8, rpe: 3, note: 'Легко' };
const SESSION: WorkoutSession = {
  id: SESSION_ID,
  workout: { id: WORKOUT_ID, name: 'Тренировка', description: null, exercises: [] },
  startedAt: '2026-10-30T12:00:00.000Z',
  finishedAt: null,
  results: [],
};

const HISTORY_SESSION_ID = 7;
const HISTORY: SessionHistoryResponse = {
  exercises: [
    {
      exerciseId: EXERCISE_ID,
      entries: [
        {
          sessionId: 5,
          finishedAt: '2026-10-29T12:00:00.000Z',
          sets: [
            {
              exerciseId: EXERCISE_ID,
              setNumber: SET_NUMBER,
              weight: 55,
              reps: 8,
              rpe: 4,
              note: null,
              completedAt: '2026-10-29T11:00:00.000Z',
            },
          ],
        },
      ],
    },
  ],
};

describe('Сервис сессий', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => {
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    for (const request of http.match((request) => request.url.endsWith('/history'))) {
      request.flush({ exercises: [] });
    }
    http.verify();
  });

  async function service(): Promise<SessionsService> {
    const sessions = TestBed.inject(SessionsService);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/sessions/active')
      .flush({ session: null });
    await TestBed.inject(ApplicationRef).whenStable();
    return sessions;
  }

  it('загружает активную сессию и допускает её отсутствие', async () => {
    const sessions = await service();
    expect(sessions.active.value()).toEqual({ session: null });
    sessions.active.reload();
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/sessions/active')
      .flush({ session: SESSION });
    await vi.waitFor(() => {
      TestBed.tick();
      TestBed.inject(HttpTestingController)
        .expectOne(`/api/sessions/${SESSION_ID}/history`)
        .flush({ exercises: [] });
    });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(sessions.active.value()).toEqual({ session: SESSION });
  });

  it('начинает тренировку через POST и обновляет активную сессию', async () => {
    const sessions = await service();
    const received: WorkoutSession[] = [];
    sessions.start(WORKOUT_ID).subscribe((value) => received.push(value));
    const request = TestBed.inject(HttpTestingController).expectOne('/api/sessions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ workoutId: WORKOUT_ID });
    request.flush(SESSION);
    expect(received).toEqual([SESSION]);
    expect(sessions.active.value()).toEqual({ session: SESSION });
  });

  it('сохраняет подход через PUT с полным телом и обновляет активную сессию', async () => {
    const sessions = await service();
    sessions.saveSet(SESSION_ID, EXERCISE_ID, SET_NUMBER, RESULT).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(
      `/api/sessions/${SESSION_ID}/sets/${EXERCISE_ID}/${SET_NUMBER}`,
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(RESULT);
    request.flush(SESSION);
    expect(sessions.active.value()).toEqual({ session: SESSION });
  });

  it('завершает тренировку и убирает её из активной', async () => {
    const sessions = await service();
    sessions.active.set({ session: SESSION });
    sessions.finish(SESSION_ID).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(
      `/api/sessions/${SESSION_ID}/finish`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ ...SESSION, finishedAt: SESSION.startedAt });
    expect(sessions.active.value()).toEqual({ session: null });
  });

  it('оставляет активную сессию при ошибке сохранения и передаёт ошибку подписчику', async () => {
    const sessions = await service();
    sessions.active.set({ session: SESSION });
    const statuses: number[] = [];
    sessions
      .saveSet(SESSION_ID, EXERCISE_ID, SET_NUMBER, RESULT)
      .subscribe({ error: (error) => statuses.push(error.status) });
    const conflict = 409;
    TestBed.inject(HttpTestingController)
      .expectOne(`/api/sessions/${SESSION_ID}/sets/${EXERCISE_ID}/${SET_NUMBER}`)
      .flush({}, { status: conflict, statusText: 'Conflict' });
    expect(statuses).toEqual([conflict]);
    expect(sessions.active.value()).toEqual({ session: SESSION });
  });
  it('не запрашивает историю, пока нет активной сессии', async () => {
    const sessions = await service();

    TestBed.inject(HttpTestingController).expectNone(`/api/sessions/${HISTORY_SESSION_ID}/history`);
    expect(sessions.history.value()).toBeUndefined();
  });

  it('загружает историю активной сессии', async () => {
    const sessions = TestBed.inject(SessionsService);
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/sessions/active')
      .flush({ session: { ...SESSION, id: HISTORY_SESSION_ID } });
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne(`/api/sessions/${HISTORY_SESSION_ID}/history`).flush(HISTORY);
    });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(sessions.history.value()).toEqual(HISTORY);
  });
});
