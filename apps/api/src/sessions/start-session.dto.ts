import type { StartSessionRequest } from '@strive/api-interfaces';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MIN_SESSION_ID } from './sessions.constants.js';

export class StartSessionDto implements StartSessionRequest {
  @Type(() => Number)
  @IsInt()
  @Min(MIN_SESSION_ID)
  @Max(Number.MAX_SAFE_INTEGER)
  workoutId!: number;
}
