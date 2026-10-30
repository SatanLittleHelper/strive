import { httpResource, type HttpResourceRef } from '@angular/common/http';
import { Service } from '@angular/core';
import type { Workout, WorkoutSummary } from '@strive/api-interfaces';
import { WORKOUTS_URL } from './workouts.constants';

// тело ответа уже разобрано unwrapResponseInterceptor
@Service()
export class WorkoutsService {
  getList(): HttpResourceRef<WorkoutSummary[] | undefined> {
    return httpResource<WorkoutSummary[]>(() => WORKOUTS_URL);
  }

  getDetails(id: () => string): HttpResourceRef<Workout | undefined> {
    return httpResource<Workout>(() => `${WORKOUTS_URL}/${encodeURIComponent(id())}`);
  }
}
