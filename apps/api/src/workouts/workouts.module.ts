import { Module } from '@nestjs/common';
import { WorkoutRepository } from './workout.repository/index.js';
import { WorkoutsController } from './workouts.controller.js';

@Module({
  controllers: [WorkoutsController],
  providers: [WorkoutRepository],
  exports: [WorkoutRepository],
})
export class WorkoutsModule {}
