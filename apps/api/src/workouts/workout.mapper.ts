import type { Workout, WorkoutSummary } from '@strive/api-interfaces';
import type { WorkoutRow, WorkoutSummaryRow } from './workout.types.js';

export function toWorkoutSummary(row: WorkoutSummaryRow): WorkoutSummary {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    exerciseCount: row._count.workout_exercises,
  };
}

export function toWorkout(row: WorkoutRow): Workout {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    exercises: row.workout_exercises.map((item) => ({
      exercise: { id: Number(item.exercise.id), name: item.exercise.name },
      position: item.position,
      sets: item.target_sets,
      repsMin: item.target_reps_min,
      repsMax: item.target_reps_max,
    })),
  };
}
