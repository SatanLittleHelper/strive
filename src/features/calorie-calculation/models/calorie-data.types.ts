import type { SelectOptionsRecord } from '@/shared';

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export const GenderOptions: SelectOptionsRecord = {
  MALE: {
    value: 'male',
    label: 'Male',
  },
  FEMALE: {
    value: 'female',
    label: 'Female',
  },
};

export const ActivityLevel: SelectOptionsRecord<{ multiplier: number }> = {
  SEDENTARY: {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise',
    multiplier: 1.2,
  },
  LIGHTLY_ACTIVE: {
    value: 'lightly_active',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    multiplier: 1.375,
  },
  MODERATELY_ACTIVE: {
    value: 'moderately_active',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    multiplier: 1.55,
  },
  VERY_ACTIVE: {
    value: 'very_active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    multiplier: 1.725,
  },
  EXTREMELY_ACTIVE: {
    value: 'extremely_active',
    label: 'Extremely Active',
    description: 'Very hard exercise, physical job',
    multiplier: 1.9,
  },
};

export const Goal: SelectOptionsRecord<{ percentageModifier: number }> = {
  LOSE_WEIGHT: {
    value: 'lose_weight',
    label: 'Lose Weight',
    description: 'Create a calorie deficit',
    percentageModifier: -20,
  },
  MAINTAIN_WEIGHT: {
    value: 'maintain_weight',
    label: 'Maintain Weight',
    description: 'Keep current weight',
    percentageModifier: 0,
  },
  GAIN_WEIGHT: {
    value: 'gain_weight',
    label: 'Gain Weight',
    description: 'Create a calorie surplus',
    percentageModifier: 15,
  },
};

export type Gender = (typeof Gender)[keyof typeof Gender];
export type ActivityLevelValue = (typeof ActivityLevel)[keyof typeof ActivityLevel]['value'];
export type GoalValue = (typeof Goal)[keyof typeof Goal]['value'];

export interface BasicData {
  gender: Gender;
  age: number;
  height: number;
  weight: number;
}

export interface ActivityData {
  activityLevel: ActivityLevelValue;
  goal: GoalValue;
}

export interface CalorieResults {
  bmr: number;
  tdee: number;
  targetCalories: number;
  formula: 'mifflin' | 'harris';
}

export interface CalorieCalculationData extends BasicData, ActivityData {}

export interface StoredCalculation {
  id: string;
  data: CalorieCalculationData;
  results: CalorieResults;
  timestamp: string;
}
