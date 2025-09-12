import { authGuard } from '@/shared/services/auth';
import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () => import('@/pages/login').then((m) => m.LOGIN_ROUTES),
    title: 'Login',
  },
  {
    path: 'register',
    loadChildren: () => import('@/pages/register').then((m) => m.REGISTER_ROUTES),
    title: 'Register',
  },
  {
    path: 'dashboard',
    loadChildren: () => import('@/pages/dashboard').then((m) => m.DASHBOARD_ROUTES),
    title: 'Dashboard',
    canMatch: [authGuard],
  },
  {
    path: 'calorie-calculator',
    loadChildren: () =>
      import('@/pages/calorie-calculator').then((m) => m.CALORIE_CALCULATOR_ROUTES),
    title: 'Calorie Calculator',
    canMatch: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];
