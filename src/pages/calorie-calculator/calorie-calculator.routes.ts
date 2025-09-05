import { CalorieCalculatorComponent } from './calorie-calculator.component';
import type { Routes } from '@angular/router';

export const CALORIE_CALCULATOR_ROUTES: Routes = [
  {
    path: '',
    component: CalorieCalculatorComponent,
    title: 'Calorie Calculator',
  },
];
