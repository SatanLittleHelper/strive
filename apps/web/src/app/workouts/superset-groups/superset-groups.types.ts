import type { WorkoutExercise } from '@strive/api-interfaces';

export interface ExerciseRow {
  items: WorkoutExercise[];
  superset: boolean;
}
