import type { Exercise } from './exercise.types.js';

export interface WorkoutExercise {
  exercise: Exercise;
  position: number;
  sets: number;
  repsMin: number;
  repsMax: number;
}

export interface Workout {
  id: number;
  name: string;
  description: string | null;
  exercises: WorkoutExercise[];
}
