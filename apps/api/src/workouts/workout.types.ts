import type { Prisma } from '../generated/prisma/client.js';
import type { WORKOUT_INCLUDE, WORKOUT_SUMMARY_INCLUDE } from './workouts.constants.js';

export type WorkoutSummaryRow = Prisma.workoutGetPayload<{
  include: typeof WORKOUT_SUMMARY_INCLUDE;
}>;

export type WorkoutRow = Prisma.workoutGetPayload<{ include: typeof WORKOUT_INCLUDE }>;
