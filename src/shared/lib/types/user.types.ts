export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  theme: Theme;
}

export interface UpdateThemeRequest {
  theme: Theme;
}

export interface UpdateThemeResponse {
  message: string;
  theme: Theme;
}
