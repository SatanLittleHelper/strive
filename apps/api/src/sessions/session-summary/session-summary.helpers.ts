import type { SessionSummary } from '@strive/api-interfaces';
import type { FinishedWorkoutSession } from '../session.types.js';
import { VOLUME_ROUNDING_FACTOR } from './session-summary.constants.js';

export function toSessionSummary(session: FinishedWorkoutSession): SessionSummary {
  const volume = session.results.reduce((sum, set) => sum + set.weight * set.reps, 0);

  return {
    id: session.id,
    workoutId: session.workout.id,
    workoutName: session.workout.name,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    exerciseCount: new Set(session.results.map((set) => set.exerciseId)).size,
    setCount: session.results.length,
    totalVolume: Math.round(volume * VOLUME_ROUNDING_FACTOR) / VOLUME_ROUNDING_FACTOR,
  };
}
