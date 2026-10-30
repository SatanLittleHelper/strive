import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SaveSetResultRequest, WorkoutSession } from '@strive/api-interfaces';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/index.js';
import { toWorkout, WORKOUT_INCLUDE } from '../../workouts/index.js';
import { toSession } from '../session.mapper.js';
import type { SaveSetParams, SessionRow } from '../session.types.js';
import { SESSION_INCLUDE } from '../sessions.constants.js';

@Injectable()
export class SessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findActive(deviceId: string): Promise<WorkoutSession | null> {
    const row = await this.prisma.workout_session.findFirst({
      where: { device_id: deviceId, finished_at: null },
      include: SESSION_INCLUDE,
    });

    return row === null ? null : this.mapSession(row);
  }

  async start(deviceId: string, workoutId: number): Promise<WorkoutSession> {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: WORKOUT_INCLUDE,
    });

    if (workout === null) throw new NotFoundException('Тренировка не найдена');

    try {
      const row = await this.prisma.workout_session.create({
        data: { device_id: deviceId, workout_id: workoutId },
        include: SESSION_INCLUDE,
      });

      return toSession({ row, workout: toWorkout(workout) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Уже есть активная тренировка');
      }

      throw error;
    }
  }

  async getOwned(deviceId: string, sessionId: number): Promise<WorkoutSession> {
    const row = await this.prisma.workout_session.findFirst({
      where: { id: sessionId, device_id: deviceId },
      include: SESSION_INCLUDE,
    });

    if (row === null) throw new NotFoundException('Сессия не найдена');

    return this.mapSession(row);
  }

  async saveSetResult(
    deviceId: string,
    params: SaveSetParams,
    data: SaveSetResultRequest,
  ): Promise<WorkoutSession> {
    const session = await this.getOwned(deviceId, params.sessionId);
    if (session.finishedAt !== null) throw new ConflictException('Тренировка уже завершена');

    const exercise = session.workout.exercises.find(
      (item) => item.exercise.id === params.exerciseId,
    );
    if (!exercise || params.setNumber > exercise.sets) {
      throw new BadRequestException('Подход не входит в план тренировки');
    }

    await this.prisma.$transaction(async (transaction) => {
      // UPDATE блокирует строку до конца транзакции и сериализует запись с завершением.
      const active = await transaction.workout_session.updateMany({
        where: { id: params.sessionId, device_id: deviceId, finished_at: null },
        data: { updated_at: new Date() },
      });
      if (active.count === 0) throw new ConflictException('Тренировка уже завершена');

      const key = {
        session_id: BigInt(params.sessionId),
        exercise_id: BigInt(params.exerciseId),
        set_number: params.setNumber,
      };
      const result = {
        weight: data.weight,
        reps: data.reps,
        rpe: data.rpe ?? null,
        note: data.note ?? null,
      };

      await transaction.set_result.upsert({
        where: { session_id_exercise_id_set_number: key },
        create: { ...key, ...result },
        update: result,
      });
    });

    return this.getOwned(deviceId, params.sessionId);
  }

  async finish(deviceId: string, sessionId: number): Promise<WorkoutSession> {
    const updated = await this.prisma.workout_session.updateMany({
      where: { id: sessionId, device_id: deviceId, finished_at: null },
      data: { finished_at: new Date() },
    });
    if (updated.count === 0) {
      // getOwned даёт 404 для чужой/отсутствующей сессии, иначе она уже завершена.
      await this.getOwned(deviceId, sessionId);
      throw new ConflictException('Тренировка уже завершена');
    }

    return this.getOwned(deviceId, sessionId);
  }

  private async mapSession(row: SessionRow): Promise<WorkoutSession> {
    const workout = await this.prisma.workout.findUnique({
      where: { id: row.workout_id },
      include: WORKOUT_INCLUDE,
    });
    if (workout === null) throw new NotFoundException('Тренировка не найдена');

    return toSession({ row, workout: toWorkout(workout) });
  }
}
