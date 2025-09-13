import { guestGuard } from '@/features/auth';
import { RegisterComponent } from './register.component';
import type { Routes } from '@angular/router';

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    component: RegisterComponent,
    title: 'Register',
    canMatch: [guestGuard],
  },
];
