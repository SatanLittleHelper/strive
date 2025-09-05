import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadChildren: () => import('@/pages/dashboard').then((m) => m.DASHBOARD_ROUTES),
    title: 'Dashboard',
  },
  {
    path: 'calorie-calculator',
    loadChildren: () =>
      import('@/pages/calorie-calculator').then((m) => m.CALORIE_CALCULATOR_ROUTES),
    title: 'Calorie Calculator',
  },
  {
    path: '**',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];
