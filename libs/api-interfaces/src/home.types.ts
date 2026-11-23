import type { WorkoutSummary } from './workout.types.js';

export type HomeWorkout = Pick<WorkoutSummary, 'id' | 'name' | 'exerciseCount'>;

export type HomeResponse =
  | { kind: 'active'; workoutName: string }
  | { kind: 'next'; workout: HomeWorkout }
  | { kind: 'empty' };
