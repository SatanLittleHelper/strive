import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MOCK_WORKOUTS } from '../workouts.constants.js';
import { WorkoutRepository } from './workout.repository.js';

const UNKNOWN_WORKOUT_ID = 999;
const FIRST_POSITION = 1;

describe('WorkoutRepository', () => {
  const repository = new WorkoutRepository();

  it('возвращает все тренировки каталога', async () => {
    const workouts = await repository.findAll();

    expect(workouts.length).toBeGreaterThan(0);
    expect(new Set(workouts.map(({ id }) => id)).size).toBe(workouts.length);
  });

  it('возвращает тренировку по идентификатору с упражнениями по порядку', async () => {
    const expected = MOCK_WORKOUTS.find(({ exercises }) => exercises.length > 1);
    expect(expected).toBeDefined();

    const workout = await repository.getById(expected?.id ?? UNKNOWN_WORKOUT_ID);

    expect(workout.id).toBe(expected?.id);
    expect(workout.exercises.map(({ position }) => position)).toEqual(
      workout.exercises.map((_exercise, index) => FIRST_POSITION + index),
    );
  });

  it('бросает NotFoundException для неизвестной тренировки', async () => {
    await expect(repository.getById(UNKNOWN_WORKOUT_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
