import type { SetResultParamsRequest } from '@strive/api-interfaces';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { SessionIdDto } from './session-id.dto.js';
import { MIN_SESSION_ID, MIN_SET_NUMBER } from './sessions.constants.js';

export class SetResultParamsDto extends SessionIdDto implements SetResultParamsRequest {
  @Type(() => Number)
  @IsInt()
  @Min(MIN_SESSION_ID)
  @Max(Number.MAX_SAFE_INTEGER)
  exerciseId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_SET_NUMBER)
  @Max(Number.MAX_SAFE_INTEGER)
  setNumber!: number;
}
