import type { Exercise } from './exercise.types.js';
import type { Workout } from './workout.types.js';

const SQUAT: Exercise = { id: 1, name: 'Приседания со штангой' };
const BENCH_PRESS: Exercise = { id: 2, name: 'Жим лёжа' };
const DEADLIFT: Exercise = { id: 3, name: 'Становая тяга' };

export const MOCK_WORKOUTS: Workout[] = [
  {
    id: 1,
    name: 'Тренировка A',
    description: 'Ноги и грудь',
    exercises: [
      { exercise: SQUAT, position: 1, sets: 3, repsMin: 6, repsMax: 8 },
      { exercise: BENCH_PRESS, position: 2, sets: 3, repsMin: 6, repsMax: 8 },
    ],
  },
  {
    id: 2,
    name: 'Тренировка B',
    description: null,
    exercises: [
      { exercise: DEADLIFT, position: 1, sets: 2, repsMin: 5, repsMax: 6 },
      { exercise: BENCH_PRESS, position: 2, sets: 3, repsMin: 8, repsMax: 10 },
    ],
  },
];
