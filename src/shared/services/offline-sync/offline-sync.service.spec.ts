import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { configureZonelessTestingModule } from '@/test-setup';
import { OfflineSyncService } from './offline-sync.service';

describe('OfflineSyncService', () => {
  let service: OfflineSyncService;
  let mockSyncFn: jasmine.Spy;

  beforeEach(() => {
    mockSyncFn = jasmine.createSpy('syncFn').and.returnValue(of({ success: true }));

    configureZonelessTestingModule({
      providers: [OfflineSyncService],
    });

    service = TestBed.inject(OfflineSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with online status', () => {
    expect(service.isOnline()).toBe(navigator.onLine);
  });

  it('should not process syncs when no pending data', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    window.dispatchEvent(new Event('online'));

    expect(mockSyncFn).not.toHaveBeenCalled();
  });

  it('should handle offline event', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    window.dispatchEvent(new Event('offline'));

    expect(service.isOnline()).toBe(false);
  });
});
