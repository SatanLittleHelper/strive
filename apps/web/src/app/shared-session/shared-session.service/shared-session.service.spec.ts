import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { FinishedSharedSession, SharedSessionResponse } from '@strive/api-interfaces';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SharedSessionService } from './shared-session.service';

const TOKEN = 'abc';
const URL_OF_SESSION = `/api/shared/${TOKEN}`;
const MIN_POLL_MS = 5000;
const MAX_POLL_MS = 10000;
const NOT_FOUND = 404;
const STARTED_AT = '2026-11-02T12:00:00.000Z';

const ACTIVE: SharedSessionResponse = {
  workout: { id: 1, name: 'Грудь', description: null, exercises: [] },
  startedAt: STARTED_AT,
  finishedAt: null,
  results: [],
};
const FINISHED: FinishedSharedSession = {
  ...ACTIVE,
  finishedAt: '2026-11-02T13:00:00.000Z',
  exerciseCount: 0,
  setCount: 0,
  totalVolume: 0,
};

describe('Сервис общей ссылки', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const http = () => TestBed.inject(HttpTestingController);

  function startWatch() {
    const watch = TestBed.runInInjectionContext(() =>
      TestBed.inject(SharedSessionService).watch(() => TOKEN),
    );
    TestBed.tick();

    return watch;
  }

  it('[ss-U11] первый запрос сразу, повторный не раньше 5 и не позже 10 секунд', async () => {
    startWatch();
    await vi.advanceTimersByTimeAsync(0);
    http().expectOne(URL_OF_SESSION).flush(ACTIVE);

    await vi.advanceTimersByTimeAsync(MIN_POLL_MS - 1);
    http().expectNone(URL_OF_SESSION);

    await vi.advanceTimersByTimeAsync(MAX_POLL_MS - MIN_POLL_MS + 1);
    http().expectOne(URL_OF_SESSION).flush(ACTIVE);
  });

  it('[ss-U12] после ответа с finishedAt опрос останавливается', async () => {
    const watch = startWatch();
    await vi.advanceTimersByTimeAsync(0);
    http().expectOne(URL_OF_SESSION).flush(FINISHED);

    await vi.advanceTimersByTimeAsync(MAX_POLL_MS * 3);

    http().expectNone(URL_OF_SESSION);
    expect(watch.status()).toBe('ready');
  });

  it('[ss-U13] сетевая ошибка после успеха сохраняет данные и помечается временной', async () => {
    const watch = startWatch();
    await vi.advanceTimersByTimeAsync(0);
    http().expectOne(URL_OF_SESSION).flush(ACTIVE);

    await vi.advanceTimersByTimeAsync(MIN_POLL_MS);
    http().expectOne(URL_OF_SESSION).error(new ProgressEvent('error'));

    expect(watch.session()).toEqual(ACTIVE);
    expect(watch.offline()).toBe(true);
    expect(watch.status()).toBe('ready');

    await vi.advanceTimersByTimeAsync(MIN_POLL_MS);
    http().expectOne(URL_OF_SESSION).flush(ACTIVE);
    expect(watch.offline()).toBe(false);
  });

  it('[ss-U14] ответ 404 останавливает опрос', async () => {
    const watch = startWatch();
    await vi.advanceTimersByTimeAsync(0);
    http().expectOne(URL_OF_SESSION).flush({}, { status: NOT_FOUND, statusText: 'Not Found' });

    await vi.advanceTimersByTimeAsync(MAX_POLL_MS * 3);

    http().expectNone(URL_OF_SESSION);
    expect(watch.status()).toBe('invalid');
  });

  it('[ss-U15] уничтожение сервиса останавливает опрос', async () => {
    startWatch();
    await vi.advanceTimersByTimeAsync(0);
    const controller = http();
    controller.expectOne(URL_OF_SESSION).flush(ACTIVE);

    TestBed.resetTestingModule();
    await vi.advanceTimersByTimeAsync(MAX_POLL_MS * 3);

    controller.expectNone(URL_OF_SESSION);
  });

  it('[ss-U16] сетевая ошибка до первого ответа — временная ошибка и повтор', async () => {
    const watch = startWatch();
    await vi.advanceTimersByTimeAsync(0);
    http().expectOne(URL_OF_SESSION).error(new ProgressEvent('error'));

    expect(watch.offline()).toBe(true);
    expect(watch.status()).toBe('loading');

    await vi.advanceTimersByTimeAsync(MIN_POLL_MS);
    http().expectOne(URL_OF_SESSION).flush(ACTIVE);

    expect(watch.status()).toBe('ready');
    expect(watch.offline()).toBe(false);
  });
});
