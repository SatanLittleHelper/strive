import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SET_RESULT_LIMITS,
  type SaveSetResultRequest,
  type SessionHistoryResponse,
  type WorkoutSession,
} from '@strive/api-interfaces';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/index.js';
import { toSession, toSetResult } from '../session.mapper.js';
import { toFinishedSessionExercises } from '../session-exercises.helpers/index.js';
import { isFinishedSession } from '../session.types.js';
import type {
  FinishedSessionExercises,
  FinishedWorkoutSession,
  SaveSetParams,
} from '../session.types.js';
import {
  SESSION_INCLUDE,
  SESSION_LIST_LIMIT,
  HISTORY_ENTRIES_PER_EXERCISE,
  HISTORY_SESSIONS_LIMIT,
} from '../sessions.constants.js';

@Injectable()
export class SessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findActive(deviceId: string): Promise<WorkoutSession | null> {
    const row = await this.prisma.workout_session.findFirst({
      where: { device_id: deviceId, finished_at: null },
      include: SESSION_INCLUDE,
    });

    return row === null ? null : toSession(row);
  }

  async start(deviceId: string, workoutId: number): Promise<WorkoutSession> {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      select: { id: true },
    });

    if (workout === null) throw new NotFoundException('Тренировка не найдена');

    try {
      const row = await this.prisma.workout_session.create({
        data: { device_id: deviceId, workout_id: workoutId },
        include: SESSION_INCLUDE,
      });

      return toSession(row);
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

    return toSession(row);
  }

  async getFinished(deviceId: string, sessionId: number): Promise<FinishedWorkoutSession> {
    const session = await this.getOwned(deviceId, sessionId);

    if (!isFinishedSession(session)) throw new ConflictException('Тренировка ещё не завершена');

    return session;
  }

  async getFinishedWithExercises(
    deviceId: string,
    sessionId: number,
  ): Promise<FinishedSessionExercises> {
    return toFinishedSessionExercises(await this.getFinished(deviceId, sessionId));
  }

  async findFinished(deviceId: string): Promise<WorkoutSession[]> {
    const rows = await this.prisma.workout_session.findMany({
      where: { device_id: deviceId, finished_at: { not: null } },
      orderBy: [{ finished_at: 'desc' }, { id: 'desc' }],
      take: SESSION_LIST_LIMIT,
      include: SESSION_INCLUDE,
    });

    return rows.map((row) => toSession(row));
  }

  async saveSetResult({
    deviceId,
    params,
    payload,
  }: {
    deviceId: string;
    params: SaveSetParams;
    payload: SaveSetResultRequest;
  }): Promise<WorkoutSession> {
    const session = await this.getOwned(deviceId, params.sessionId);
    if (session.finishedAt !== null) throw new ConflictException('Тренировка уже завершена');

    const row = session.workout.exercises.find((item) => item.id === params.workoutExerciseId);

    if (!row) throw new BadRequestException('Упражнение не входит в план тренировки');
    if (params.setNumber > SET_RESULT_LIMITS.setNumberMax) {
      throw new BadRequestException('Номер подхода выше допустимого');
    }

    await this.prisma.$transaction(async (transaction) => {
      // UPDATE блокирует строку до конца транзакции и сериализует запись с завершением.
      const active = await transaction.workout_session.updateMany({
        where: { id: params.sessionId, device_id: deviceId, finished_at: null },
        data: { updated_at: new Date() },
      });
      if (active.count === 0) throw new ConflictException('Тренировка уже завершена');

      const key = {
        session_id: params.sessionId,
        workout_exercise_id: params.workoutExerciseId,
        set_number: params.setNumber,
      };
      const result = {
        weight: payload.weight,
        reps: payload.reps,
        rpe: payload.rpe ?? null,
        note: payload.note ?? null,
      };

      await transaction.set_result.upsert({
        where: { session_id_workout_exercise_id_set_number: key },
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

  async getHistory(deviceId: string, sessionId: number): Promise<SessionHistoryResponse> {
    const session = await this.getOwned(deviceId, sessionId);
    const exerciseIds = [...new Set(session.workout.exercises.map((item) => item.exercise.id))];
    const ofPlanExercises = { workout_exercise: { exercise_id: { in: exerciseIds } } };

    const rows = await this.prisma.workout_session.findMany({
      where: {
        device_id: deviceId,
        finished_at: { not: null },
        id: { not: sessionId },
        set_results: { some: ofPlanExercises },
      },
      orderBy: { finished_at: 'desc' },
      take: HISTORY_SESSIONS_LIMIT,
      include: {
        set_results: {
          where: ofPlanExercises,
          include: { workout_exercise: { select: { exercise_id: true } } },
          orderBy: [{ workout_exercise_id: 'asc' }, { set_number: 'asc' }],
        },
      },
    });

    return {
      exercises: exerciseIds.map((exerciseId) => ({
        exerciseId,
        entries: rows
          .flatMap((row) => {
            const sets = row.set_results.filter(
              (set) => Number(set.workout_exercise.exercise_id) === exerciseId,
            );
            if (sets.length === 0 || row.finished_at === null) return [];

            return [
              {
                sessionId: Number(row.id),
                finishedAt: row.finished_at.toISOString(),
                sets: sets.map(toSetResult),
              },
            ];
          })
          .slice(0, HISTORY_ENTRIES_PER_EXERCISE),
      })),
    };
  }
}
