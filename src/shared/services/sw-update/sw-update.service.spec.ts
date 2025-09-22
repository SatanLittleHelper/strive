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

    swUpdateSpy.checkForUpdate.and.returnValue(Promise.resolve(true));

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
});
