import {
  DEFAULT_RPE,
  type ExerciseHistory,
  type SetResult,
  type WorkoutExercise,
  type WorkoutSession,
} from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import { setsOf } from '../test-support/session.fixtures';
import {
  countCompletedSets,
  findResult,
  toSaveSetRequest,
  getActiveSetNumber,
  getFirstUnfinishedExerciseIndex,
  getSetDefaults,
  getSwipeStep,
} from './session-form.helpers';

const EXERCISE_ID = 1;
const SET_NUMBER = 1;
const RESULT = {
  workoutExerciseId: EXERCISE_ID,
  setNumber: SET_NUMBER,
  weight: 60.25,
  reps: 8,
  rpe: 3,
  note: 'Легко',
  completedAt: '2026-10-30T12:00:00.000Z',
};
const SESSION: WorkoutSession = {
  id: 1,
  workout: {
    id: 1,
    name: 'Тренировка',
    description: null,
    exercises: [
      {
        exercise: { id: EXERCISE_ID, name: 'Жим' },
        id: EXERCISE_ID,
        occurrence: 1,
        sets: 3,
        reps: 8,
        weight: null,
        supersetGroup: null,
      },
    ],
  },
  startedAt: RESULT.completedAt,
  finishedAt: null,
  results: [RESULT],
};

describe('Запрос на сохранение подхода', () => {
  const VALUES = { weight: 60.25, reps: 8, rpe: 3, note: 'Легко' };

  it('U19 · пустой RPE превращается в «нет значения»', () => {
    expect(toSaveSetRequest({ ...VALUES, rpe: null })).toEqual({ ...VALUES, rpe: null });
  });

  it('U20 · заметка из пробелов превращается в «нет значения»', () => {
    expect(toSaveSetRequest({ ...VALUES, note: '   ' })).toEqual({ ...VALUES, note: null });
  });

  it('U21 · пробелы по краям заметки обрезаются, остальные значения сохраняются', () => {
    expect(toSaveSetRequest({ ...VALUES, note: '  Легко  ' })).toEqual(VALUES);
  });
});

describe('Результаты тренировки', () => {
  it('считает сохранённые подходы', () => {
    expect(countCompletedSets(SESSION)).toBe(1);
    expect(countCompletedSets({ ...SESSION, results: [] })).toBe(0);
  });

  it('находит результат по упражнению и номеру подхода', () => {
    expect(
      findResult({ session: SESSION, workoutExerciseId: EXERCISE_ID, setNumber: SET_NUMBER }),
    ).toEqual(RESULT);
    expect(
      findResult({ session: SESSION, workoutExerciseId: EXERCISE_ID, setNumber: SET_NUMBER + 1 }),
    ).toBeUndefined();
    expect(
      findResult({ session: SESSION, workoutExerciseId: EXERCISE_ID + 1, setNumber: SET_NUMBER }),
    ).toBeUndefined();
  });
});

const SQUAT_ID = 1;
const BENCH_ID = 2;
const PLAN_WEIGHT = 60;
const PLAN_SETS = 3;
const PLAN_REPS = 8;
const OTHER_PLAN_REPS = 12;
const SESSION_RESULT_WEIGHT = 62.5;
const SESSION_RESULT_REPS = 7;
const SESSION_RESULT_RPE = 4;
const HISTORY_WEIGHT = 55;
const OLD_HISTORY_WEIGHT = 40;
const OTHER_EXERCISE_WEIGHT = 100;
const THIRD_SET = 3;
const COMPLETED_AT = '2026-11-01T10:00:00.000Z';

function planExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    exercise: { id: SQUAT_ID, name: 'Приседания' },
    id: SQUAT_ID,
    occurrence: 1,
    sets: PLAN_SETS,
    reps: PLAN_REPS,
    weight: PLAN_WEIGHT,
    supersetGroup: null,
    ...overrides,
  };
}

function savedSet(overrides: Partial<SetResult> = {}): SetResult {
  return {
    workoutExerciseId: SQUAT_ID,
    setNumber: 1,
    weight: SESSION_RESULT_WEIGHT,
    reps: SESSION_RESULT_REPS,
    rpe: SESSION_RESULT_RPE,
    note: null,
    completedAt: COMPLETED_AT,
    ...overrides,
  };
}

function historyOf(...sets: SetResult[][]): ExerciseHistory {
  return {
    exerciseId: SQUAT_ID,
    entries: sets.map((entrySets, index) => ({
      sessionId: index + 1,
      finishedAt: COMPLETED_AT,
      sets: entrySets,
    })),
  };
}

function sessionOf(exercises: WorkoutExercise[], results: SetResult[]): WorkoutSession {
  return {
    id: 1,
    workout: { id: 1, name: 'Тренировка', description: null, exercises },
    startedAt: COMPLETED_AT,
    finishedAt: null,
    results,
  };
}

describe('Значения подхода по умолчанию', () => {
  it('берёт значения предыдущего сохранённого подхода этого упражнения', () => {
    const values = getSetDefaults({
      exercise: planExercise(),
      setNumber: 2,
      results: [savedSet()],
    });

    expect(values).toEqual({
      weight: SESSION_RESULT_WEIGHT,
      reps: SESSION_RESULT_REPS,
      rpe: SESSION_RESULT_RPE,
      note: '',
    });
  });

  it('считает предыдущим подход с наибольшим номером меньше текущего', () => {
    const values = getSetDefaults({
      exercise: planExercise(),
      setNumber: THIRD_SET,
      results: [savedSet({ weight: 70, reps: 5 })],
    });

    expect(values).toMatchObject({ weight: 70, reps: 5 });
  });

  it('без предыдущего подхода берёт план и RPE по умолчанию', () => {
    const values = getSetDefaults({ exercise: planExercise(), setNumber: 1, results: [] });

    expect(values).toEqual({
      weight: PLAN_WEIGHT,
      reps: PLAN_REPS,
      rpe: DEFAULT_RPE,
      note: '',
    });
  });

  it('повторы по умолчанию равны цели упражнения', () => {
    const withOtherPlan = getSetDefaults({
      exercise: planExercise({ reps: OTHER_PLAN_REPS }),
      setNumber: 1,
      results: [],
    });
    const withDefaultPlan = getSetDefaults({ exercise: planExercise(), setNumber: 1, results: [] });

    expect(withOtherPlan.reps).toBe(OTHER_PLAN_REPS);
    expect(withDefaultPlan.reps).toBe(PLAN_REPS);
  });

  it('без целевого веса берёт вес подхода с тем же номером из последней записи истории', () => {
    const values = getSetDefaults({
      exercise: planExercise({ weight: null }),
      setNumber: 2,
      results: [],
      history: historyOf([savedSet({ setNumber: 2, weight: HISTORY_WEIGHT })]),
    });

    expect(values.weight).toBe(HISTORY_WEIGHT);
  });

  it('при заданном целевом весе приоритет у плана, а не у истории', () => {
    const values = getSetDefaults({
      exercise: planExercise(),
      setNumber: 1,
      results: [],
      history: historyOf([savedSet({ setNumber: 1, weight: HISTORY_WEIGHT })]),
    });

    expect(values.weight).toBe(PLAN_WEIGHT);
  });

  it('оставляет вес пустым, если в последней записи нет подхода с таким номером', () => {
    const values = getSetDefaults({
      exercise: planExercise({ weight: null }),
      setNumber: THIRD_SET,
      results: [],
      history: historyOf(
        [savedSet({ setNumber: 1 }), savedSet({ setNumber: 2 })],
        [savedSet({ setNumber: THIRD_SET, weight: OLD_HISTORY_WEIGHT })],
      ),
    });

    expect(values.weight).toBeNull();
  });

  it('без подходов, плана и истории оставляет вес пустым', () => {
    const values = getSetDefaults({
      exercise: planExercise({ weight: null }),
      setNumber: 1,
      results: [],
    });

    expect(values).toEqual({ weight: null, reps: PLAN_REPS, rpe: DEFAULT_RPE, note: '' });
  });

  it('не копирует заметку предыдущего подхода', () => {
    const values = getSetDefaults({
      exercise: planExercise(),
      setNumber: 2,
      results: [savedSet({ note: 'болело плечо' })],
    });

    expect(values.note).toBe('');
  });

  it('игнорирует подходы других упражнений', () => {
    const values = getSetDefaults({
      exercise: planExercise(),
      setNumber: 1,
      results: [savedSet({ workoutExerciseId: BENCH_ID, weight: OTHER_EXERCISE_WEIGHT, reps: 3 })],
    });

    expect(values).toMatchObject({ weight: PLAN_WEIGHT, reps: PLAN_REPS });
  });
});

describe('Стартовое упражнение и активный подход', () => {
  const squat = planExercise();
  const bench = planExercise({
    exercise: { id: BENCH_ID, name: 'Жим' },
    id: BENCH_ID,
    occurrence: 1,
  });
  const row = planExercise({ exercise: { id: 3, name: 'Тяга' }, id: 3, occurrence: 1 });

  function fullResults(exercise: WorkoutExercise): SetResult[] {
    return Array.from({ length: exercise.sets }, (_, index) =>
      savedSet({ workoutExerciseId: exercise.id, setNumber: index + 1 }),
    );
  }

  it('начинает с первого упражнения с невыполненными подходами', () => {
    const results = [...fullResults(squat), ...fullResults(bench)].slice(0, 5);
    const session = sessionOf([squat, bench, row], results);

    expect(getFirstUnfinishedExerciseIndex(session)).toBe(1);
  });

  it('начинает с последнего упражнения, если выполнено всё', () => {
    const session = sessionOf([squat, bench], [...fullResults(squat), ...fullResults(bench)]);

    expect(getFirstUnfinishedExerciseIndex(session)).toBe(1);
  });

  it('активный подход — первый несохранённый', () => {
    const results = [savedSet({ setNumber: 1 }), savedSet({ setNumber: THIRD_SET })];

    expect(getActiveSetNumber({ exercise: squat, results })).toBe(2);
  });

  it('без несохранённых подходов активного подхода нет', () => {
    expect(getActiveSetNumber({ exercise: squat, results: fullResults(squat) })).toBeNull();
  });
});

describe('Шаг свайпа', () => {
  const COUNT = 3;

  it.each([
    { index: 0, direction: 'left', expected: 1 },
    { index: 1, direction: 'right', expected: 0 },
    { index: 0, direction: 'right', expected: 0 },
    { index: 2, direction: 'left', expected: 2 },
  ] as const)(
    'свайп $direction с упражнения $index ведёт на $expected',
    ({ index, direction, expected }) => {
      expect(getSwipeStep({ index, count: COUNT, direction })).toBe(expected);
    },
  );

  it.each(['top', 'bottom'] as const)('вертикальный жест %s не меняет упражнение', (direction) => {
    expect(getSwipeStep({ index: 1, count: COUNT, direction })).toBe(1);
  });
});

describe('Вход в сессию с суперсетом', () => {
  const GROUP = 1;
  const A1 = planExercise({ supersetGroup: GROUP });
  const A2 = planExercise({
    id: BENCH_ID,
    exercise: { id: BENCH_ID, name: 'Жим' },
    supersetGroup: GROUP,
  });

  it('[U9] при возврате на экран открывается первый незакрытый шаг суперсета', () => {
    const results = [
      ...setsOf({ workoutExerciseId: 1, setNumbers: [1, 2] }),
      ...setsOf({ workoutExerciseId: 2, setNumbers: [1] }),
    ];

    expect(getFirstUnfinishedExerciseIndex(sessionOf([A1, A2], results))).toBe(1);
  });
});

describe('Повтор упражнения: значения и вход в сессию', () => {
  const SHARED_EXERCISE = { id: SQUAT_ID, name: 'Приседания' };
  const FIRST_ROW_ID = 1;
  const SECOND_ROW_ID = 2;
  const FIRST_ROW_WEIGHT = 12;
  const SECOND_ROW_PLAN_WEIGHT = 10;

  it('[U3] предзаполнение подхода берёт данные своей строки', () => {
    const second = planExercise({
      id: SECOND_ROW_ID,
      exercise: SHARED_EXERCISE,
      occurrence: 2,
      weight: SECOND_ROW_PLAN_WEIGHT,
    });
    const results = [
      savedSet({ workoutExerciseId: FIRST_ROW_ID, setNumber: 1, weight: FIRST_ROW_WEIGHT }),
    ];

    const values = getSetDefaults({ exercise: second, setNumber: 2, results, history: undefined });

    expect(values.weight).toBe(SECOND_ROW_PLAN_WEIGHT);
    const first = planExercise({ id: FIRST_ROW_ID, exercise: SHARED_EXERCISE });
    expect(getSetDefaults({ exercise: first, setNumber: 2, results }).weight).toBe(
      FIRST_ROW_WEIGHT,
    );
  });

  it('[U5] вход в сессию открывает нужное вхождение', () => {
    const first = planExercise({ id: FIRST_ROW_ID, exercise: SHARED_EXERCISE, occurrence: 1 });
    const second = planExercise({ id: SECOND_ROW_ID, exercise: SHARED_EXERCISE, occurrence: 2 });
    const results = [1, 2, 3].map((setNumber) =>
      savedSet({ workoutExerciseId: FIRST_ROW_ID, setNumber }),
    );
    const session = {
      ...SESSION,
      workout: { ...SESSION.workout, exercises: [first, second] },
      results,
    };

    expect(getFirstUnfinishedExerciseIndex(session)).toBe(1);
  });
});
