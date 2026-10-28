export interface HealthResponse {
  service: string;
  status: 'ok';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string | null;
  data: T | null;
  details: unknown;
}
