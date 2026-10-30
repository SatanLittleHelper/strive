import { SET_RESULT_LIMITS, type SaveSetResultRequest } from '@strive/api-interfaces';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveSetResultDto implements SaveSetResultRequest {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(SET_RESULT_LIMITS.weightMax)
  weight!: number;

  @IsInt()
  @Min(SET_RESULT_LIMITS.repsMin)
  @Max(SET_RESULT_LIMITS.repsMax)
  reps!: number;

  @IsOptional()
  @IsInt()
  @Min(SET_RESULT_LIMITS.rpeMin)
  @Max(SET_RESULT_LIMITS.rpeMax)
  rpe?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(SET_RESULT_LIMITS.noteMaxLength)
  note?: string | null;
}
