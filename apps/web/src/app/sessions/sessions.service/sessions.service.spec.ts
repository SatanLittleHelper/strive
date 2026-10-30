import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { WorkoutSession } from '@strive/api-interfaces';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

describe('Сервис сессий', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
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
});
