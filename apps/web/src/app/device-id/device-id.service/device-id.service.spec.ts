import { TestBed } from '@angular/core/testing';
import { isDeviceId } from '@strive/api-interfaces';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_ID_STORAGE_KEY } from '../device-id.constants';
import { DeviceIdService } from './device-id.service';

const SAVED_DEVICE_ID = '3f2b8f44-5c1d-4a52-9e5b-0b8b6f3c1a10';

describe('Идентификатор устройства', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('создаёт UUID при первом запуске и сохраняет его', () => {
    const service = TestBed.inject(DeviceIdService);

    expect(isDeviceId(service.id)).toBe(true);
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(service.id);
  });

  it('использует сохранённый идентификатор', () => {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, SAVED_DEVICE_ID);

    expect(TestBed.inject(DeviceIdService).id).toBe(SAVED_DEVICE_ID);
  });

  it('заменяет некорректное сохранённое значение', () => {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'broken');

    const service = TestBed.inject(DeviceIdService);

    expect(isDeviceId(service.id)).toBe(true);
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(service.id);
  });

  it('работает без доступного localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    const service = TestBed.inject(DeviceIdService);

    expect(isDeviceId(service.id)).toBe(true);
    expect(TestBed.inject(DeviceIdService).id).toBe(service.id);
  });
});
