import { Injectable, NotFoundException } from '@nestjs/common';
import type { Workout } from '../workout.types.js';
import { MOCK_WORKOUTS } from '../workouts.constants.js';

@Injectable()
export class WorkoutRepository {
  // Каталог пока моковый; асинхронные сигнатуры сохранятся при переходе на БД.
  async findAll(): Promise<Workout[]> {
    return MOCK_WORKOUTS;
  }

  async getById(id: number): Promise<Workout> {
    const workout = MOCK_WORKOUTS.find((candidate) => candidate.id === id);

    if (workout === undefined) {
      throw new NotFoundException(`Тренировка ${id} не найдена`);
    }

    return workout;
  }
}
