import { Inject, Injectable } from '@nestjs/common';
import type { HomeResponse } from '@strive/api-interfaces';
import { HomeRepository } from '../home.repository/index.js';

@Injectable()
export class HomeService {
  constructor(@Inject(HomeRepository) private readonly repository: HomeRepository) {}

  async getHome(deviceId: string): Promise<HomeResponse> {
    const workoutName = await this.repository.findActiveWorkoutName(deviceId);
    if (workoutName !== null) return { kind: 'active', workoutName };

    const lastId = await this.repository.findLastFinishedWorkoutId(deviceId);
    const next = lastId === null ? null : await this.repository.findNextWorkout(lastId);
    const workout = next ?? (await this.repository.findFirstWorkout());

    return workout === null ? { kind: 'empty' } : { kind: 'next', workout };
  }
}
