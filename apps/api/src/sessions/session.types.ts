import type { Workout } from '@strive/api-interfaces';
import type { Prisma } from '../generated/prisma/client.js';
import type { SESSION_INCLUDE } from './sessions.constants.js';

export type SessionRow = Prisma.workout_sessionGetPayload<{ include: typeof SESSION_INCLUDE }>;

export interface SessionMapping {
  row: SessionRow;
  workout: Workout;
}

export interface SaveSetParams {
  sessionId: number;
  exerciseId: number;
  setNumber: number;
}

export type SetResultRow = Prisma.set_resultGetPayload<Record<string, never>>;
