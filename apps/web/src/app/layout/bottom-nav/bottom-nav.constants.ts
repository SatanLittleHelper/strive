import type { NavItem } from './bottom-nav.types';

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Главная', exact: true },
  { path: '/workouts', label: 'Тренировки' },
  { path: '/history', label: 'История' },
];
