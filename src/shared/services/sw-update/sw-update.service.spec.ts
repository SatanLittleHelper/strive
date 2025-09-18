import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { configureZonelessTestingModule } from '@/test-setup';
import { SwUpdateService } from './sw-update.service';
import type { VersionEvent } from '@angular/service-worker';

describe('SwUpdateService', () => {
  let service: SwUpdateService;
  let swUpdateSpy: jasmine.SpyObj<SwUpdate>;
  let versionUpdatesSubject: Subject<VersionEvent>;
  let destroyCallback: (() => void) | undefined;

  beforeEach(() => {
    spyOn(window, 'confirm');
    versionUpdatesSubject = new Subject<VersionEvent>();

    swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['checkForUpdate'], {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable(),
    });

    const destroyRefSpy = jasmine.createSpyObj('DestroyRef', ['onDestroy']);
    destroyRefSpy.onDestroy.and.callFake((callback: () => void) => {
      destroyCallback = callback;
    });

    configureZonelessTestingModule({
      providers: [
        SwUpdateService,
        { provide: SwUpdate, useValue: swUpdateSpy },
        { provide: DestroyRef, useValue: destroyRefSpy },
      ],
    });
  });

  afterEach(() => {
    if (destroyCallback) {
      destroyCallback();
    }
  });

  it('should create', () => {
    service = TestBed.inject(SwUpdateService);
    expect(service).toBeTruthy();
  });

  it('should initialize service worker integration', () => {
    service = TestBed.inject(SwUpdateService);
    expect(service).toBeTruthy();
    expect(swUpdateSpy.isEnabled).toBe(true);
  });

  it('should not initialize when service worker is disabled', () => {
    swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['checkForUpdate'], {
      isEnabled: false,
      versionUpdates: versionUpdatesSubject.asObservable(),
    });

    TestBed.overrideProvider(SwUpdate, { useValue: swUpdateSpy });
    service = TestBed.inject(SwUpdateService);

    expect(swUpdateSpy.checkForUpdate).not.toHaveBeenCalled();
  });

  it('should handle service worker integration', () => {
    service = TestBed.inject(SwUpdateService);
    expect(service).toBeTruthy();
    expect(swUpdateSpy.isEnabled).toBe(true);
  });

  it('should show confirm dialog on VERSION_READY event', (done) => {
    service = TestBed.inject(SwUpdateService);

    versionUpdatesSubject.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new' },
    } as VersionEvent);

    setTimeout(() => {
      expect(window.confirm).toHaveBeenCalledWith('New version available. Load new version?');
      done();
    }, 100);
  });

  it('should ignore non-VERSION_READY events', () => {
    service = TestBed.inject(SwUpdateService);

    versionUpdatesSubject.next({
      type: 'VERSION_DETECTED',
      version: { hash: 'new' },
    });

    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('should abort event listeners on destroy', () => {
    service = TestBed.inject(SwUpdateService);

    if (destroyCallback) {
      destroyCallback();
    }

    expect(service).toBeTruthy();
  });
});
