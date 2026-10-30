import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Workout, WorkoutSummary } from '@strive/api-interfaces';
import { PrismaService } from '../../prisma/index.js';
import { toWorkout, toWorkoutSummary } from '../workout.mapper.js';
import { WORKOUT_INCLUDE, WORKOUT_SUMMARY_INCLUDE } from '../workouts.constants.js';

@Injectable()
export class WorkoutRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(): Promise<WorkoutSummary[]> {
    const rows = await this.prisma.workout.findMany({
      orderBy: { id: 'asc' },
      include: WORKOUT_SUMMARY_INCLUDE,
    });

    return rows.map(toWorkoutSummary);
  }

  async getById(id: number): Promise<Workout> {
    const row = await this.prisma.workout.findUnique({ where: { id }, include: WORKOUT_INCLUDE });

    if (row === null) {
      throw new NotFoundException(`Тренировка ${id} не найдена`);
    }

    return toWorkout(row);
  }
}
