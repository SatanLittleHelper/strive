import type { SelectOptionsRecord } from '@/shared';

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export const GenderOptions: SelectOptionsRecord = {
  MALE: {
    value: Gender.MALE,
    label: 'Male',
  },
  FEMALE: {
    value: Gender.FEMALE,
    label: 'Female',
  },
};

export const ActivityLevel = {
  SEDENTARY: 'sedentary',
  LIGHTLY_ACTIVE: 'lightly_active',
  MODERATELY_ACTIVE: 'moderately_active',
  VERY_ACTIVE: 'very_active',
  EXTREMELY_ACTIVE: 'extremely_active',
} as const;

export const ActivityLevelOptions: SelectOptionsRecord<{ multiplier: number }> = {
  SEDENTARY: {
    value: ActivityLevel.SEDENTARY,
    label: 'Sedentary',
    description: 'Little or no exercise',
    multiplier: 1.2,
  },
  LIGHTLY_ACTIVE: {
    value: ActivityLevel.LIGHTLY_ACTIVE,
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    multiplier: 1.375,
  },
  MODERATELY_ACTIVE: {
    value: ActivityLevel.MODERATELY_ACTIVE,
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    multiplier: 1.55,
  },
  VERY_ACTIVE: {
    value: ActivityLevel.VERY_ACTIVE,
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    multiplier: 1.725,
  },
  EXTREMELY_ACTIVE: {
    value: ActivityLevel.EXTREMELY_ACTIVE,
    label: 'Extremely Active',
    description: 'Very hard exercise, physical job',
    multiplier: 1.9,
  },
};

export const Goal = {
  LOSE_WEIGHT: 'lose_weight',
  MAINTAIN_WEIGHT: 'maintain_weight',
  GAIN_WEIGHT: 'gain_weight',
} as const;

export const GoalOptions: SelectOptionsRecord<{ percentageModifier: number }> = {
  LOSE_WEIGHT: {
    value: Goal.LOSE_WEIGHT,
    label: 'Lose Weight',
    description: 'Create a calorie deficit',
    percentageModifier: -20,
  },
  MAINTAIN_WEIGHT: {
    value: Goal.MAINTAIN_WEIGHT,
    label: 'Maintain Weight',
    description: 'Keep current weight',
    percentageModifier: 0,
  },
  GAIN_WEIGHT: {
    value: Goal.GAIN_WEIGHT,
    label: 'Gain Weight',
    description: 'Create a calorie surplus',
    percentageModifier: 15,
  },
};

export type Gender = (typeof Gender)[keyof typeof Gender];
export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];
export type Goal = (typeof Goal)[keyof typeof Goal];

export interface BasicData {
  gender: Gender;
  age: number;
  height: number;
  weight: number;
}

export interface ActivityData {
  activityLevel: ActivityLevel;
  goal: Goal;
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

export const DEFAULT_BASIC_DATA: BasicData = {
  gender: Gender.MALE,
  age: 35,
  height: 175,
  weight: 80,
};

export const DEFAULT_ACTIVITY_DATA: ActivityData = {
  activityLevel: ActivityLevel.MODERATELY_ACTIVE,
  goal: Goal.LOSE_WEIGHT,
};
