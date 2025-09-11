import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import type { Macronutrients } from '@/entities/macronutrients';
import { ActivityLevelOptions, GoalOptions } from '../models/calorie-data.types';
import type {
  BasicData,
  CalorieCalculationData,
  CalorieResults,
  ActivityLevel,
  Goal,
} from '../models/calorie-data.types';
import type { Observable } from 'rxjs';

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
const PROTEIN_KCAL_PER_GRAM = 4;
const FAT_KCAL_PER_GRAM = 9;
const CARBS_KCAL_PER_GRAM = 4;
const BMR_MALE_OFFSET = 5;
const BMR_FEMALE_OFFSET = -161;
const BMR_WEIGHT_MULTIPLIER = 10;
const BMR_HEIGHT_MULTIPLIER = 6.25;
const BMR_AGE_MULTIPLIER = 5;
const PERCENTAGE_MULTIPLIER = 100;
const ROUNDING_PRECISION = 10;

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
              if (parsed.results && !parsed.results.macros) {
                parsed.results.macros = this.calculateMacronutrients(
                  parsed.data,
                  parsed.results.targetCalories,
                );
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
    const baseBMR =
      BMR_WEIGHT_MULTIPLIER * weight + BMR_HEIGHT_MULTIPLIER * height - BMR_AGE_MULTIPLIER * age;
    return gender === 'male' ? baseBMR + BMR_MALE_OFFSET : baseBMR + BMR_FEMALE_OFFSET;
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

    const proteinBase = PROTEIN_BASE_BY_ACTIVITY[activityLevel];
    const proteinGoalAdj = PROTEIN_GOAL_ADJUSTMENT[goal];
    let proteinGrams =
      Math.round(weight * (proteinBase + proteinGoalAdj) * ROUNDING_PRECISION) / ROUNDING_PRECISION;

    const fatBase = FAT_BASE_BY_GOAL[goal];
    let fatGrams = Math.round(weight * fatBase * ROUNDING_PRECISION) / ROUNDING_PRECISION;

    let carbsCalories =
      targetCalories - (proteinGrams * PROTEIN_KCAL_PER_GRAM + fatGrams * FAT_KCAL_PER_GRAM);
    let carbsGrams = Math.max(0, Math.round(carbsCalories / CARBS_KCAL_PER_GRAM));

    if (carbsCalories < 0) {
      const fatCaloriesMin = targetCalories * MIN_FAT_PERCENTAGE;
      const fatGramsMin =
        Math.round((fatCaloriesMin / FAT_KCAL_PER_GRAM) * ROUNDING_PRECISION) / ROUNDING_PRECISION;

      if (fatGrams > fatGramsMin) {
        fatGrams = fatGramsMin;
      }

      const proteinGramsMin =
        Math.round(MIN_PROTEIN_PER_KG * weight * ROUNDING_PRECISION) / ROUNDING_PRECISION;

      if (proteinGrams > proteinGramsMin) {
        proteinGrams = proteinGramsMin;
      }

      carbsCalories =
        targetCalories - (proteinGrams * PROTEIN_KCAL_PER_GRAM + fatGrams * FAT_KCAL_PER_GRAM);
      carbsGrams = Math.max(0, Math.round(carbsCalories / CARBS_KCAL_PER_GRAM));
    }

    const finalProteinGrams = Math.round(proteinGrams);
    const finalFatGrams = Math.round(fatGrams);
    const finalCarbsGrams = Math.round(carbsGrams);

    const proteinPercentage =
      Math.round(
        ((finalProteinGrams * PROTEIN_KCAL_PER_GRAM) / targetCalories) *
          PERCENTAGE_MULTIPLIER *
          ROUNDING_PRECISION,
      ) / ROUNDING_PRECISION;
    const fatPercentage =
      Math.round(
        ((finalFatGrams * FAT_KCAL_PER_GRAM) / targetCalories) *
          PERCENTAGE_MULTIPLIER *
          ROUNDING_PRECISION,
      ) / ROUNDING_PRECISION;
    const carbsPercentage =
      Math.round(
        ((finalCarbsGrams * CARBS_KCAL_PER_GRAM) / targetCalories) *
          PERCENTAGE_MULTIPLIER *
          ROUNDING_PRECISION,
      ) / ROUNDING_PRECISION;

    return {
      proteinGrams: finalProteinGrams,
      fatGrams: finalFatGrams,
      carbsGrams: finalCarbsGrams,
      proteinPercentage,
      fatPercentage,
      carbsPercentage,
    };
  }
}
