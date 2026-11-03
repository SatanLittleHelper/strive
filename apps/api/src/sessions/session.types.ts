import type { SessionExerciseResults, WorkoutSession } from '@strive/api-interfaces';
import type { Prisma } from '../generated/prisma/client.js';
import type { SESSION_INCLUDE } from './sessions.constants.js';

export type SessionRow = Prisma.workout_sessionGetPayload<{ include: typeof SESSION_INCLUDE }>;

export interface SaveSetParams {
  sessionId: number;
  exerciseId: number;
  setNumber: number;
}

export type SetResultRow = Prisma.set_resultGetPayload<Record<string, never>>;

export type FinishedWorkoutSession = WorkoutSession & { finishedAt: string };

export interface FinishedSessionExercises {
  id: number;
  workout: { id: number; name: string };
  startedAt: string;
  finishedAt: string;
  exercises: SessionExerciseResults[];
}

export function isFinishedSession(session: WorkoutSession): session is FinishedWorkoutSession {
  return session.finishedAt !== null;
}
