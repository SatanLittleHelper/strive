import type { SetResult, WorkoutExercise } from '@strive/api-interfaces';

export interface ExerciseResultsParams {
  exercise: WorkoutExercise;
  results: SetResult[];
}

export interface AdvanceParams {
  exercise: WorkoutExercise;
  resultsBefore: SetResult[];
  savedSetNumber: number;
  isLastExercise: boolean;
}

export interface AdvanceTargetParams {
  exercises: WorkoutExercise[];
  resultsBefore: SetResult[];
  currentIndex: number;
  savedSetNumber: number;
}

export interface ActiveEditorSet {
  mode: 'plan' | 'edit';
  setNumber: number;
}

export interface NoEditorSet {
  mode: 'none';
  setNumber: null;
}

export type EditorSet = ActiveEditorSet | NoEditorSet;

export interface EditorSetParams {
  exercise: WorkoutExercise;
  results: SetResult[];
  selected: number | null;
}

export type PrimaryAction = 'save' | 'next' | 'finish';

export interface PrimaryActionParams {
  hasForm: boolean;
  isLastExercise: boolean;
  sessionDone: boolean;
}

export interface SavedSetEvent {
  setNumber: number;
  resultsBefore: SetResult[];
}

export interface PendingAdvance {
  target: number;
  secondsLeft: number;
}
