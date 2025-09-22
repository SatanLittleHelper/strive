export class TokenRefreshManager {
  private refreshInProgress = false;
  private pendingRequests: Array<() => void> = [];
  private static instance: TokenRefreshManager;

  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }

  get isRefreshInProgress(): boolean {
    return this.refreshInProgress;
  }

  setRefreshInProgress(value: boolean): void {
    this.refreshInProgress = value;
  }

  addPendingRequest(request: () => void): void {
    this.pendingRequests.push(request);
  }

  processPendingRequests(): void {
    this.pendingRequests.forEach((request) => request());
    this.pendingRequests = [];
  }

  clearPendingRequests(): void {
    this.pendingRequests = [];
  }
}
