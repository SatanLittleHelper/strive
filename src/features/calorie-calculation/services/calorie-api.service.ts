import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { ActivityLevelOptions, GoalOptions } from '../models/calorie-data.types';
import type {
  BasicData,
  CalorieCalculationData,
  CalorieResults,
  Macronutrients,
  ActivityLevel,
  Goal,
} from '../models/calorie-data.types';
import type { Observable } from 'rxjs';

// Macronutrient calculation constants
const PROTEIN_BASE_BY_ACTIVITY = {
  sedentary: 1.6,
  lightly_active: 1.7,
  moderately_active: 1.9,
  very_active: 2.1,
  extremely_active: 2.2,
} as const;

const PROTEIN_GOAL_ADJUSTMENT = {
  lose_weight: 0.2,
  maintain_weight: 0.0,
  gain_weight: 0.1,
} as const;

const FAT_BASE_BY_GOAL = {
  lose_weight: 0.8,
  maintain_weight: 1.0,
  gain_weight: 1.1,
} as const;

const MIN_PROTEIN_PER_KG = 1.4;
const MIN_FAT_PERCENTAGE = 0.2;

@Injectable({ providedIn: 'root' })
export class CalorieApiService {
  calculateCalories(data: CalorieCalculationData): Observable<CalorieResults> {
    return from(
      new Promise<CalorieResults>((resolve) => {
        setTimeout(() => {
          const bmrMifflin = this.calculateBMRMifflin(data);
          const tdee = this.calculateTDEE(bmrMifflin, data.activityLevel);
          const targetCalories = this.calculateTargetCalories(tdee, data.goal);
          const macros = this.calculateMacronutrients(data, targetCalories);

          const results = {
            bmr: Math.round(bmrMifflin),
            tdee,
            targetCalories,
            formula: 'mifflin' as const,
            macros,
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
              const parsed = JSON.parse(stored);
              // Lazy migration: if macros are missing, calculate them
              if (parsed.results && !parsed.results.macros) {
                parsed.results.macros = this.calculateMacronutrients(
                  parsed.data,
                  parsed.results.targetCalories,
                );
                // Save updated result with macros
                this.saveCalculation(parsed.data, parsed.results);
              }
              resolve(parsed);
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

  private calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const activityOption = Object.values(ActivityLevelOptions).find(
      (option) => option.value === activityLevel,
    );
    const multiplier = activityOption?.multiplier ?? 1.2;
    return Math.round(bmr * multiplier);
  }

  private calculateTargetCalories(tdee: number, goal: Goal): number {
    const goalOption = Object.values(GoalOptions).find((option) => option.value === goal);
    const percentageModifier = goalOption?.percentageModifier ?? 0;
    const modifier = (tdee * percentageModifier) / 100;
    return Math.round(tdee + modifier);
  }

  private saveCalculation(data: CalorieCalculationData, results: CalorieResults): void {
    localStorage.setItem('calorie_calculation', JSON.stringify({ data, results }));
  }

  private calculateMacronutrients(
    data: CalorieCalculationData,
    targetCalories: number,
  ): Macronutrients {
    const { weight, activityLevel, goal } = data;

    // Calculate protein
    const proteinBase = PROTEIN_BASE_BY_ACTIVITY[activityLevel];
    const proteinGoalAdj = PROTEIN_GOAL_ADJUSTMENT[goal];
    let proteinGrams = Math.round(weight * (proteinBase + proteinGoalAdj) * 10) / 10;

    // Calculate fat
    const fatBase = FAT_BASE_BY_GOAL[goal];
    let fatGrams = Math.round(weight * fatBase * 10) / 10;

    // Calculate carbs
    let carbsCalories = targetCalories - (proteinGrams * 4 + fatGrams * 9);
    let carbsGrams = Math.max(0, Math.round(carbsCalories / 4));

    // Adjustment if carbs are negative
    if (carbsCalories < 0) {
      // 1. Reduce fat to minimum 20% of calories if above that
      const fatCaloriesMin = targetCalories * MIN_FAT_PERCENTAGE;
      const fatGramsMin = Math.round((fatCaloriesMin / 9) * 10) / 10;

      if (fatGrams > fatGramsMin) {
        fatGrams = fatGramsMin;
      }

      // 2. If still deficit, reduce protein but not below 1.4 g/kg
      const proteinGramsMin = Math.round(MIN_PROTEIN_PER_KG * weight * 10) / 10;

      if (proteinGrams > proteinGramsMin) {
        proteinGrams = proteinGramsMin;
      }

      // 3. Recalculate carbs
      carbsCalories = targetCalories - (proteinGrams * 4 + fatGrams * 9);
      carbsGrams = Math.max(0, Math.round(carbsCalories / 4));
    }

    // Round to whole grams (or 0.5/1.0 as needed for UX)
    return {
      proteinGrams: Math.round(proteinGrams),
      fatGrams: Math.round(fatGrams),
      carbsGrams: Math.round(carbsGrams),
    };
  }
}
