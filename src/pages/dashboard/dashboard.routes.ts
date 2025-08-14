import { DashboardComponent } from './ui/dashboard.component';

import type { Route } from '@angular/router';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Dashboard',
  },
];
