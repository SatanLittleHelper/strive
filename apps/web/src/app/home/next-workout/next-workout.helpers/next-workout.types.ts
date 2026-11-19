import type { WorkoutSession, WorkoutSummary } from '@strive/api-interfaces';

export interface NextWorkoutParams {
  workouts: WorkoutSummary[];
  finished: WorkoutSession[];
}

type FinishedSession = WorkoutSession & { finishedAt: string };

export const isFinished = (session: WorkoutSession): session is FinishedSession =>
  session.finishedAt !== null;
