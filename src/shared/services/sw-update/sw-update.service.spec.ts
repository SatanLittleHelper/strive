import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { configureZonelessTestingModule } from '@/test-setup';
import { SwUpdateService } from './sw-update.service';
import type { DestroyRef } from '@angular/core';
import type { VersionEvent } from '@angular/service-worker';

describe('SwUpdateService', () => {
  let service: SwUpdateService;
  let swUpdateSpy: jasmine.SpyObj<SwUpdate>;
  let versionUpdatesSubject: Subject<VersionEvent>;
  let destroyCallback: (() => void) | undefined;
  let mockAbortController: { abort: jasmine.Spy; signal: any };

  beforeEach(() => {
    // Mock AbortController if not available
    mockAbortController = {
      abort: jasmine.createSpy('abort'),
      signal: { aborted: false }
    };
    
    if (typeof AbortController === 'undefined') {
      (global as any).AbortController = class {
        abort = mockAbortController.abort;
        signal = mockAbortController.signal;
      };
    }
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

    spyOn(document, 'addEventListener');
    spyOn(window, 'addEventListener');
    spyOn(window, 'confirm');
    spyOn(window.location, 'reload');
  });

  afterEach(() => {
    if (destroyCallback) {
      destroyCallback();
    }
    
    // Clean up global AbortController mock if we added it
    if (typeof AbortController !== 'undefined' && (global as any).AbortController === AbortController) {
      delete (global as any).AbortController;
    }
  });

  it('should create', () => {
    service = TestBed.inject(SwUpdateService);
    expect(service).toBeTruthy();
  });

  it('should check for updates on initialization', () => {
    service = TestBed.inject(SwUpdateService);
    expect(swUpdateSpy.checkForUpdate).toHaveBeenCalled();
  });

  it('should register event listeners when service worker is enabled', () => {
    service = TestBed.inject(SwUpdateService);

    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      jasmine.any(Function),
      jasmine.objectContaining({ signal: jasmine.anything() }),
    );

    expect(window.addEventListener).toHaveBeenCalledWith(
      'focus',
      jasmine.any(Function),
      jasmine.objectContaining({ signal: jasmine.anything() }),
    );

    expect(window.addEventListener).toHaveBeenCalledWith(
      'load',
      jasmine.any(Function),
      jasmine.objectContaining({ signal: jasmine.anything() }),
    );
  });

  it('should not initialize when service worker is disabled', () => {
    swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['checkForUpdate'], {
      isEnabled: false,
      versionUpdates: versionUpdatesSubject.asObservable(),
    });

    TestBed.overrideProvider(SwUpdate, { useValue: swUpdateSpy });
    service = TestBed.inject(SwUpdateService);

    expect(swUpdateSpy.checkForUpdate).not.toHaveBeenCalled();
    expect(document.addEventListener).not.toHaveBeenCalled();
  });

  it('should check for updates when document becomes visible', () => {
    service = TestBed.inject(SwUpdateService);
    swUpdateSpy.checkForUpdate.calls.reset();

    const visibilityChangeHandler = (document.addEventListener as jasmine.Spy).calls
      .allArgs()
      .find((args) => args[0] === 'visibilitychange')[1];

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });

    visibilityChangeHandler();

    expect(swUpdateSpy.checkForUpdate).toHaveBeenCalled();
  });

  it('should not check for updates when document is hidden', () => {
    service = TestBed.inject(SwUpdateService);
    swUpdateSpy.checkForUpdate.calls.reset();

    const visibilityChangeHandler = (document.addEventListener as jasmine.Spy).calls
      .allArgs()
      .find((args) => args[0] === 'visibilitychange')[1];

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });

    visibilityChangeHandler();

    expect(swUpdateSpy.checkForUpdate).not.toHaveBeenCalled();
  });

  it('should handle version ready events', () => {
    service = TestBed.inject(SwUpdateService);
    (window.confirm as jasmine.Spy).and.returnValue(true);

    versionUpdatesSubject.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new' },
    });

    expect(window.confirm).toHaveBeenCalledWith('New version available. Load new version?');
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should not reload when user cancels update', () => {
    service = TestBed.inject(SwUpdateService);
    (window.confirm as jasmine.Spy).and.returnValue(false);

    versionUpdatesSubject.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new' },
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('should ignore non-VERSION_READY events', () => {
    service = TestBed.inject(SwUpdateService);

    versionUpdatesSubject.next({
      type: 'VERSION_DETECTED',
      version: { hash: 'new' },
    });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('should abort event listeners on destroy', () => {
    const abortSpy = spyOn(AbortController.prototype, 'abort').and.callThrough();
    
    service = TestBed.inject(SwUpdateService);

    if (destroyCallback) {
      destroyCallback();
    }

    expect(abortSpy).toHaveBeenCalled();
  });
});
