import { guestGuard } from '@/shared/services/auth';
import { LoginComponent } from './login.component';
import type { Routes } from '@angular/router';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    component: LoginComponent,
    title: 'Login',
    canMatch: [guestGuard],
  },
];
