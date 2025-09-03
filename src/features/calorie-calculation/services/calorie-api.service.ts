import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { ActivityLevel, Goal } from '../models/calorie-data.types';
import type {
  BasicData,
  CalorieCalculationData,
  CalorieResults,
  ActivityLevelValue,
  GoalValue,
} from '../models/calorie-data.types';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CalorieApiService {
  calculateCalories(data: CalorieCalculationData): Observable<CalorieResults> {
    return from(
      new Promise<CalorieResults>((resolve) => {
        setTimeout(() => {
          const bmrMifflin = this.calculateBMRMifflin(data);
          const tdee = this.calculateTDEE(bmrMifflin, data.activityLevel);
          const targetCalories = this.calculateTargetCalories(tdee, data.goal);

          const results = {
            bmr: Math.round(bmrMifflin),
            tdee,
            targetCalories,
            formula: 'mifflin' as const,
          };

          this.saveCalculation(data, results);
          resolve(results);
        }, 100);
      }),
    );
  }

  getCaloriesResult(): Observable<{
    data: CalorieCalculationData;
    results: CalorieResults;
  } | null> {
    return from(
      new Promise<{
        data: CalorieCalculationData;
        results: CalorieResults;
      } | null>((resolve) => {
        setTimeout(() => {
          const stored = localStorage.getItem('calorie_calculation');
          if (stored) {
            try {
              resolve(JSON.parse(stored));
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        }, 50);
      }),
    );
  }

  private calculateBMRMifflin(data: BasicData): number {
    const { gender, age, height, weight } = data;
    const baseBMR = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
  }

  private calculateTDEE(bmr: number, activityLevel: ActivityLevelValue): number {
    const activityOption = Object.values(ActivityLevel).find(
      (option) => option.value === activityLevel,
    );
    const multiplier = activityOption?.multiplier ?? 1.2;
    return Math.round(bmr * multiplier);
  }

  private calculateTargetCalories(tdee: number, goal: GoalValue): number {
    const goalOption = Object.values(Goal).find((option) => option.value === goal);
    const percentageModifier = goalOption?.percentageModifier ?? 0;
    const modifier = (tdee * percentageModifier) / 100;
    return Math.round(tdee + modifier);
  }

  private saveCalculation(data: CalorieCalculationData, results: CalorieResults): void {
    localStorage.setItem('calorie_calculation', JSON.stringify({ data, results }));
  }
}
