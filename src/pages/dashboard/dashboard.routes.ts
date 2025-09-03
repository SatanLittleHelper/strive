import { DashboardComponent } from './ui/dashboard.component';

import type { Route } from '@angular/router';

export const DASHBOARD_ROUTES: Route[] = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Dashboard',
  },
];
