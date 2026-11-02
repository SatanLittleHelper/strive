import type {
  ExerciseHistory,
  SaveSetResultRequest,
  SetResult,
  WorkoutExercise,
} from '@strive/api-interfaces';

export interface RawSetInput {
  weight: string;
  reps: string;
  rpe: string;
  note: string;
}

export type SetInputValidation =
  { ok: true; value: SaveSetResultRequest } | { ok: false; error: string };

export interface SetFormValues {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  note: string;
}

export interface SetDefaultsParams {
  exercise: WorkoutExercise;
  setNumber: number;
  results: SetResult[];
  history?: ExerciseHistory;
}

export interface ActiveSetParams {
  exercise: WorkoutExercise;
  results: SetResult[];
}

export type SwipeDirection = 'left' | 'right' | 'top' | 'bottom';

export interface SwipeStepParams {
  index: number;
  count: number;
  direction: SwipeDirection;
}

export interface FillRequest {
  setNumber: number;
  values: SetFormValues;
}
