import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DeviceIdService } from '../device-id.service';
import { deviceIdInterceptor } from './device-id.interceptor';

describe('Интерцептор идентификатора устройства', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([deviceIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('добавляет идентификатор устройства к запросам API', () => {
    TestBed.inject(HttpClient).get('/api/workouts').subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/workouts');
    expect(request.request.headers.get(DEVICE_ID_HEADER)).toBe(TestBed.inject(DeviceIdService).id);
    request.flush({});
  });

  it('не добавляет заголовок к путям, лишь похожим на API', () => {
    TestBed.inject(HttpClient).get('/apiary/data').subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/apiary/data');
    expect(request.request.headers.has(DEVICE_ID_HEADER)).toBe(false);
    request.flush({});
  });

  it('не добавляет заголовок к запросам на внешние адреса', () => {
    TestBed.inject(HttpClient).get('https://example.com/data').subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('https://example.com/data');
    expect(request.request.headers.has(DEVICE_ID_HEADER)).toBe(false);
    request.flush({});
  });
});
