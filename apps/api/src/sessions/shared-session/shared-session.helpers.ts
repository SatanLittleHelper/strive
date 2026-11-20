import type {
  SetResult,
  SharedSessionResponse,
  SharedSetResult,
  WorkoutSession,
} from '@strive/api-interfaces';
import { toFinishedSessionExercises } from '../session-exercises.helpers/index.js';
import { toSessionSummary } from '../session-summary/index.js';
import { isFinishedSession } from '../session.types.js';

function toSharedSetResult({
  workoutExerciseId,
  setNumber,
  weight,
  reps,
  rpe,
  completedAt,
}: SetResult): SharedSetResult {
  return { workoutExerciseId, setNumber, weight, reps, rpe, completedAt };
}

export function toSharedSession(session: WorkoutSession): SharedSessionResponse {
  const base = {
    workout: session.workout,
    startedAt: session.startedAt,
    results: session.results.map(toSharedSetResult),
  };

  if (!isFinishedSession(session)) return { ...base, finishedAt: null };

  const { exerciseCount, setCount, totalVolume } = toSessionSummary(
    toFinishedSessionExercises(session),
  );

  return { ...base, finishedAt: session.finishedAt, exerciseCount, setCount, totalVolume };
}
