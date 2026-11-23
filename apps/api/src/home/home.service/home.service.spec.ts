import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HomeRepository } from '../home.repository/index.js';
import { HomeService } from './home.service.js';

const first = { id: 2, name: 'Ноги', exerciseCount: 3 };
const next = { id: 9, name: 'Грудь', exerciseCount: 4 };
const device = 'device-a';
const repository = {
  findActiveWorkoutName: vi.fn<HomeRepository['findActiveWorkoutName']>(),
  findLastFinishedWorkoutId: vi.fn<HomeRepository['findLastFinishedWorkoutId']>(),
  findNextWorkout: vi.fn<HomeRepository['findNextWorkout']>(),
  findFirstWorkout: vi.fn<HomeRepository['findFirstWorkout']>(),
};
const service = new HomeService(repository as unknown as HomeRepository);

describe('Карточка главной', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repository.findActiveWorkoutName.mockResolvedValue(null);
    repository.findLastFinishedWorkoutId.mockResolvedValue(null);
    repository.findNextWorkout.mockResolvedValue(null);
    repository.findFirstWorkout.mockResolvedValue(first);
  });

  it('[U1] отдаёт активную тренировку без вычисления рекомендации', async () => {
    repository.findActiveWorkoutName.mockResolvedValue('Ноги');
    repository.findLastFinishedWorkoutId.mockResolvedValue(5);
    expect(await service.getHome(device)).toEqual({ kind: 'active', workoutName: 'Ноги' });
    expect(repository.findActiveWorkoutName).toHaveBeenCalledWith(device);
    expect(repository.findLastFinishedWorkoutId).not.toHaveBeenCalled();
    expect(repository.findNextWorkout).not.toHaveBeenCalled();
    expect(repository.findFirstWorkout).not.toHaveBeenCalled();
  });

  it('[U2] отдаёт следующую тренировку после завершённой', async () => {
    repository.findLastFinishedWorkoutId.mockResolvedValue(5);
    repository.findNextWorkout.mockResolvedValue(next);
    expect(await service.getHome(device)).toEqual({ kind: 'next', workout: next });
    expect(repository.findLastFinishedWorkoutId).toHaveBeenCalledWith(device);
    expect(repository.findNextWorkout).toHaveBeenCalledWith(5);
    expect(repository.findFirstWorkout).not.toHaveBeenCalled();
  });

  it('[U3] начинает с первой тренировки без истории', async () => {
    expect(await service.getHome(device)).toEqual({ kind: 'next', workout: first });
    expect(repository.findNextWorkout).not.toHaveBeenCalled();
  });

  it.each([
    ['U4', 'после конца каталога', 9],
    ['U5', 'если завершённой тренировки нет в каталоге', 99],
  ])('[%s] возвращается к первой тренировке %s', async (_id, _label, workoutId) => {
    repository.findLastFinishedWorkoutId.mockResolvedValue(workoutId);
    expect(await service.getHome(device)).toEqual({ kind: 'next', workout: first });
    expect(repository.findNextWorkout).toHaveBeenCalledWith(workoutId);
  });

  it('[U6] отдаёт пустое состояние с пустым каталогом', async () => {
    repository.findFirstWorkout.mockResolvedValue(null);
    expect(await service.getHome(device)).toEqual({ kind: 'empty' });
  });
});
