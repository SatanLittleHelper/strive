import type { HomeWorkout } from '@strive/api-interfaces';
import type { Prisma } from '../../generated/prisma/client.js';
import type { HOME_WORKOUT_SELECT } from './home.constants.js';

export function toHomeWorkout(
  row: Prisma.workoutGetPayload<{ select: typeof HOME_WORKOUT_SELECT }>,
): HomeWorkout {
  return { id: Number(row.id), name: row.name, exerciseCount: row._count.workout_exercises };
}
