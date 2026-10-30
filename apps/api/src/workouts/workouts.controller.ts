import { Controller, Get, Inject, Param, ValidationPipe } from '@nestjs/common';
import type { Workout, WorkoutSummary } from '@strive/api-interfaces';
import { VALIDATION_PIPE_OPTIONS } from '../common/validation-pipe.constants.js';
import { WorkoutIdDto } from './workout-id.dto.js';
import { WorkoutRepository } from './workout.repository/index.js';

@Controller('workouts')
export class WorkoutsController {
  constructor(@Inject(WorkoutRepository) private readonly workouts: WorkoutRepository) {}

  @Get()
  getList(): Promise<WorkoutSummary[]> {
    return this.workouts.findAll();
  }

  // tsx в dev-запуске не эмитит типы параметров, поэтому класс DTO задан явно
  @Get(':id')
  getDetails(
    @Param(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: WorkoutIdDto }))
    params: WorkoutIdDto,
  ): Promise<Workout> {
    return this.workouts.getById(params.id);
  }
}
