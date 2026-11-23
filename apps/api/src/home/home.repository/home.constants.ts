import type { Prisma } from '../../generated/prisma/client.js';

export const HOME_WORKOUT_SELECT = {
  id: true,
  name: true,
  _count: { select: { workout_exercises: true } },
} satisfies Prisma.workoutSelect;
