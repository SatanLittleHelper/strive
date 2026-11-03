import type { SessionSummary } from '@strive/api-interfaces';
import type { FinishedSessionExercises } from '../session.types.js';
import { VOLUME_ROUNDING_FACTOR } from './session-summary.constants.js';

export function toSessionSummary(session: FinishedSessionExercises): SessionSummary {
  const sets = session.exercises.flatMap((exercise) => exercise.sets);
  const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

  return {
    id: session.id,
    workoutId: session.workout.id,
    workoutName: session.workout.name,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    exerciseCount: session.exercises.length,
    setCount: sets.length,
    totalVolume: Math.round(volume * VOLUME_ROUNDING_FACTOR) / VOLUME_ROUNDING_FACTOR,
    exercises: session.exercises,
  };
}
