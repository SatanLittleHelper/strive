import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { unwrapResponseInterceptor } from './unwrap-response.interceptor';

const DATA = { id: 1 };
const ERROR_MESSAGE = 'Сбой';
const INVALID_RESPONSE_MESSAGE = 'Некорректный ответ API';

describe('Интерцептор разбора ответа API', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unwrapResponseInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('отдаёт подписчику данные из единого формата ответа API', () => {
    const received: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('/api/workouts')
      .subscribe((body) => received.push(body));

    TestBed.inject(HttpTestingController)
      .expectOne('/api/workouts')
      .flush({ success: true, message: null, data: DATA, details: null });

    expect(received).toEqual([DATA]);
  });

  it('превращает неуспешный ответ API в ошибку запроса', () => {
    const errors: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('/api/workouts')
      .subscribe({ error: (error: unknown) => errors.push(error) });

    TestBed.inject(HttpTestingController)
      .expectOne('/api/workouts')
      .flush({ success: false, message: ERROR_MESSAGE, data: null, details: null });

    expect(errors).toEqual([new Error(ERROR_MESSAGE)]);
  });

  it('превращает ответ не в формате API в ошибку запроса', () => {
    const errors: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('/api/workouts')
      .subscribe({ error: (error: unknown) => errors.push(error) });

    TestBed.inject(HttpTestingController).expectOne('/api/workouts').flush('<html></html>');

    expect(errors).toEqual([new Error(INVALID_RESPONSE_MESSAGE)]);
  });

  it('не трогает успешный ответ без тела', () => {
    const events: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('/api/workouts', { observe: 'response' })
      .subscribe((response) => events.push(response.status));

    TestBed.inject(HttpTestingController)
      .expectOne('/api/workouts')
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(events).toEqual([204]);
  });

  it('не трогает ответы с телом не в формате JSON', () => {
    const received: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('/api/export', { responseType: 'text' })
      .subscribe((body) => received.push(body));

    TestBed.inject(HttpTestingController).expectOne('/api/export').flush('a,b');

    expect(received).toEqual(['a,b']);
  });

  it('не трогает ответы путей, лишь похожих на API', () => {
    const received: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('/apiary/data')
      .subscribe((body) => received.push(body));

    TestBed.inject(HttpTestingController).expectOne('/apiary/data').flush(DATA);

    expect(received).toEqual([DATA]);
  });

  it('не трогает ответы внешних адресов', () => {
    const received: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('https://example.com/data')
      .subscribe((body) => received.push(body));

    TestBed.inject(HttpTestingController).expectOne('https://example.com/data').flush(DATA);

    expect(received).toEqual([DATA]);
  });
});
