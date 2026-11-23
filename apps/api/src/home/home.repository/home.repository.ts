import { Inject, Injectable } from '@nestjs/common';
import type { HomeWorkout } from '@strive/api-interfaces';
import { PrismaService } from '../../prisma/index.js';
import { HOME_WORKOUT_SELECT } from './home.constants.js';
import { toHomeWorkout } from './home.mapper.js';

@Injectable()
export class HomeRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findActiveWorkoutName(deviceId: string): Promise<string | null> {
    const row = await this.prisma.workout_session.findFirst({
      where: { device_id: deviceId, finished_at: null },
      select: { workout: { select: { name: true } } },
    });

    return row?.workout.name ?? null;
  }

  async findLastFinishedWorkoutId(deviceId: string): Promise<number | null> {
    const row = await this.prisma.workout_session.findFirst({
      where: { device_id: deviceId, finished_at: { not: null } },
      orderBy: [{ finished_at: 'desc' }, { id: 'desc' }],
      select: { workout_id: true },
    });

    return row === null ? null : Number(row.workout_id);
  }

  async findNextWorkout(workoutId: number): Promise<HomeWorkout | null> {
    const [previous, next] = await this.prisma.workout.findMany({
      where: { id: { gte: workoutId } },
      orderBy: { id: 'asc' },
      take: 2,
      select: HOME_WORKOUT_SELECT,
    });

    return previous && Number(previous.id) === workoutId && next ? toHomeWorkout(next) : null;
  }

  async findFirstWorkout(): Promise<HomeWorkout | null> {
    const row = await this.prisma.workout.findFirst({
      orderBy: { id: 'asc' },
      select: HOME_WORKOUT_SELECT,
    });

    return row === null ? null : toHomeWorkout(row);
  }
}
