import { configureZonelessTestingModule } from '@/test-setup';
import { TokenRefreshManager } from './token-refresh-manager';

describe('TokenRefreshManager', () => {
  let manager: TokenRefreshManager;

  beforeEach(() => {
    configureZonelessTestingModule({
      providers: [],
    });

    manager = TokenRefreshManager.getInstance();
  });

  afterEach(() => {
    manager.clearPendingRequests();
    manager.setRefreshInProgress(false);
  });

  it('should be a singleton', () => {
    const instance1 = TokenRefreshManager.getInstance();
    const instance2 = TokenRefreshManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should track refresh progress state', () => {
    expect(manager.isRefreshInProgress).toBe(false);

    manager.setRefreshInProgress(true);
    expect(manager.isRefreshInProgress).toBe(true);

    manager.setRefreshInProgress(false);
    expect(manager.isRefreshInProgress).toBe(false);
  });

  it('should manage pending requests', () => {
    const request1 = jasmine.createSpy('request1');
    const request2 = jasmine.createSpy('request2');

    manager.addPendingRequest(request1);
    manager.addPendingRequest(request2);

    manager.processPendingRequests();
    expect(request1).toHaveBeenCalled();
    expect(request2).toHaveBeenCalled();
  });

  it('should process pending requests', () => {
    const request1 = jasmine.createSpy('request1');
    const request2 = jasmine.createSpy('request2');

    manager.addPendingRequest(request1);
    manager.addPendingRequest(request2);

    manager.processPendingRequests();

    expect(request1).toHaveBeenCalled();
    expect(request2).toHaveBeenCalled();
  });

  it('should clear pending requests', () => {
    const request1 = jasmine.createSpy('request1');
    const request2 = jasmine.createSpy('request2');

    manager.addPendingRequest(request1);
    manager.addPendingRequest(request2);

    manager.clearPendingRequests();

    expect(request1).not.toHaveBeenCalled();
    expect(request2).not.toHaveBeenCalled();
  });

  it('should handle multiple pending requests correctly', () => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      const request = jasmine.createSpy(`request${i}`);
      requests.push(request);
      manager.addPendingRequest(request);
    }

    manager.processPendingRequests();

    requests.forEach((request) => {
      expect(request).toHaveBeenCalled();
    });
  });

  it('should maintain state across multiple operations', () => {
    manager.setRefreshInProgress(true);
    expect(manager.isRefreshInProgress).toBe(true);

    const request = jasmine.createSpy('request');
    manager.addPendingRequest(request);

    manager.processPendingRequests();
    expect(request).toHaveBeenCalled();

    manager.setRefreshInProgress(false);
    expect(manager.isRefreshInProgress).toBe(false);
  });
});
