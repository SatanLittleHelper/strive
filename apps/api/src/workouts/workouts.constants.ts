import type { Prisma } from '../generated/prisma/client.js';

export const WORKOUT_SUMMARY_INCLUDE = {
  _count: { select: { workout_exercises: true } },
} satisfies Prisma.workoutInclude;

export const WORKOUT_INCLUDE = {
  workout_exercises: { orderBy: { position: 'asc' }, include: { exercise: true } },
} satisfies Prisma.workoutInclude;

export const MIN_WORKOUT_ID = 1;
