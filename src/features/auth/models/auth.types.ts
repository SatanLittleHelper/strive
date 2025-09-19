export type TokenType = 'Bearer';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  expires_in: number;
  token_type: TokenType;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RefreshResponse {
  expires_in: number;
  token_type: TokenType;
  message: string;
}
