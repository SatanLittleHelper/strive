import type { Routes } from '@angular/router';

const loadPlaceholder = () =>
  import('./layout/section-placeholder').then((module) => module.SectionPlaceholderComponent);

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((module) => module.HomeComponent),
  },
  { path: 'workouts', loadComponent: loadPlaceholder, data: { heading: 'Тренировки' } },
  { path: 'history', loadComponent: loadPlaceholder, data: { heading: 'История' } },
  { path: '**', redirectTo: '' },
];
