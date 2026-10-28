import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HealthService } from './health.service';

describe('Состояние API', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('показывает ожидание до получения ответа', () => {
    const service = TestBed.inject(HealthService);
    expect(service.status()).toBe('Проверка API…');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/health')
      .flush({ success: true, data: { status: 'ok' } });
  });

  it('показывает доступность после успешной проверки', () => {
    const service = TestBed.inject(HealthService);
    TestBed.inject(HttpTestingController)
      .expectOne('/api/health')
      .flush({ success: true, data: { status: 'ok' } });
    expect(service.status()).toBe('API работает');
  });

  it('обрабатывает неуспешный ответ API', () => {
    const service = TestBed.inject(HealthService);
    TestBed.inject(HttpTestingController)
      .expectOne('/api/health')
      .flush({ success: false, data: null });
    expect(service.status()).toBe('API недоступен');
  });

  it('обрабатывает сетевую ошибку', () => {
    const service = TestBed.inject(HealthService);
    TestBed.inject(HttpTestingController)
      .expectOne('/api/health')
      .error(new ProgressEvent('error'));
    expect(service.status()).toBe('API недоступен');
  });
});
