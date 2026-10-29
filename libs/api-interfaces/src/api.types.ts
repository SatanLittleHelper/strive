export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string | null;
  data: T | null;
  details: unknown;
}

export type HealthStatus = 'ok' | 'error' | 'shutting_down';

export interface HealthIndicatorStatus {
  status: 'up' | 'down';
}

export interface HealthResponse {
  status: HealthStatus;
  details: Record<string, HealthIndicatorStatus>;
  info?: Record<string, HealthIndicatorStatus>;
  error?: Record<string, HealthIndicatorStatus>;
}
