import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((module) => module.HomeComponent),
  },
  {
    path: 'workouts',
    loadComponent: () =>
      import('./workouts/workout-list').then((module) => module.WorkoutListComponent),
  },
  {
    path: 'workouts/session',
    loadComponent: () =>
      import('./sessions/active-session').then((module) => module.ActiveSessionComponent),
  },
  {
    path: 'workouts/:id',
    loadComponent: () =>
      import('./workouts/workout-details').then((module) => module.WorkoutDetailsComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history/history-list').then((module) => module.HistoryListComponent),
  },
  {
    path: 'history/:id',
    loadComponent: () =>
      import('./history/history-details').then((module) => module.HistoryDetailsComponent),
  },
  { path: '**', redirectTo: '' },
];
