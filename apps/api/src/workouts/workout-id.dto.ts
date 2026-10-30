import type { WorkoutIdRequest } from '@strive/api-interfaces';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MIN_WORKOUT_ID } from './workouts.constants.js';

export class WorkoutIdDto implements WorkoutIdRequest {
  // строка из адреса в число: явно, без зависимости от метаданных типов
  @Type(() => Number)
  @IsInt()
  @Min(MIN_WORKOUT_ID)
  @Max(Number.MAX_SAFE_INTEGER)
  id!: number;
}
