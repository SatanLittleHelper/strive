import { Module } from '@nestjs/common';
import { WorkoutRepository } from './workout.repository/index.js';

@Module({ providers: [WorkoutRepository], exports: [WorkoutRepository] })
export class WorkoutsModule {}
