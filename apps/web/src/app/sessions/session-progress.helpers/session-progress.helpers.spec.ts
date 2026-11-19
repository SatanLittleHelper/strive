import { describe, expect, it } from 'vitest';
import { planExercise, range, sessionOf, setsOf } from '../test-support/session.fixtures';
import {
  countExerciseSets,
  getExerciseCompletion,
  getRingMax,
  getAdvanceTarget,
  isExerciseDone,
  isSessionDone,
  shouldAdvanceAfterSave,
} from './session-progress.helpers';

const FIRST_ID = 7;
const SECOND_ID = 8;
const THIRD_ID = 9;
const FOURTH_SET = 4;
const PLANNED_SETS = 3;

describe('Прогресс упражнения и тренировки', () => {
  const first = planExercise({ id: FIRST_ID });
  const second = planExercise({ id: SECOND_ID });
  const third = planExercise({ id: THIRD_ID });

  it('считает сохранённые подходы только текущего упражнения', () => {
    const results = [
      ...setsOf({ workoutExerciseId: FIRST_ID, setNumbers: [1, 2] }),
      ...setsOf({ workoutExerciseId: SECOND_ID, setNumbers: [1] }),
    ];

    expect(countExerciseSets({ exercise: first, results })).toBe(2);
    expect(countExerciseSets({ exercise: second, results })).toBe(1);
  });

  it('шкала кольца — большее из плана и сохранённых подходов', () => {
    const twoSaved = setsOf({ workoutExerciseId: FIRST_ID, setNumbers: [1, 2] });
    const fourSaved = setsOf({ workoutExerciseId: FIRST_ID, setNumbers: range(FOURTH_SET) });

    expect(getRingMax({ exercise: first, results: twoSaved })).toBe(PLANNED_SETS);
    expect(getRingMax({ exercise: first, results: fourSaved })).toBe(FOURTH_SET);
  });

  it('упражнение выполнено, когда сохранены все плановые подходы и есть дополнительные', () => {
    const results = setsOf({ workoutExerciseId: FIRST_ID, setNumbers: range(FOURTH_SET) });

    expect(isExerciseDone({ exercise: first, results })).toBe(true);
  });

  it('упражнение не выполнено, пока не хватает планового подхода', () => {
    const results = setsOf({ workoutExerciseId: FIRST_ID, setNumbers: [1, 2] });

    expect(isExerciseDone({ exercise: first, results })).toBe(false);
  });

  it('тренировка не выполнена, пока в одном упражнении не хватает подхода, даже при дополнительных в другом', () => {
    const results = [
      ...setsOf({ workoutExerciseId: FIRST_ID, setNumbers: range(FOURTH_SET) }),
      ...setsOf({ workoutExerciseId: SECOND_ID, setNumbers: range(PLANNED_SETS) }),
      ...setsOf({ workoutExerciseId: THIRD_ID, setNumbers: [1, 2] }),
    ];

    expect(isSessionDone(sessionOf({ exercises: [first, second, third], results }))).toBe(false);
  });

  it('тренировка выполнена, когда выполнены все упражнения плана', () => {
    const results = [FIRST_ID, SECOND_ID, THIRD_ID].flatMap((exerciseId) =>
      setsOf({ workoutExerciseId: exerciseId, setNumbers: range(PLANNED_SETS) }),
    );

    expect(isSessionDone(sessionOf({ exercises: [first, second, third], results }))).toBe(true);
  });
});

describe('Автопереход после сохранения подхода', () => {
  const exercise = planExercise({ id: FIRST_ID });

  function advance({
    saved,
    savedSetNumber,
    isLastExercise = false,
  }: {
    saved: number[];
    savedSetNumber: number;
    isLastExercise?: boolean;
  }): boolean {
    return shouldAdvanceAfterSave({
      exercise,
      resultsBefore: setsOf({ workoutExerciseId: FIRST_ID, setNumbers: saved }),
      savedSetNumber,
      isLastExercise,
    });
  }

  it('переходит после сохранения последнего планового подхода', () => {
    expect(advance({ saved: [1, 2], savedSetNumber: 3 })).toBe(true);
  });

  it('не переходит, если упражнение последнее', () => {
    expect(advance({ saved: [1, 2], savedSetNumber: 3, isLastExercise: true })).toBe(false);
  });

  it('не переходит при сохранении дополнительного подхода', () => {
    expect(advance({ saved: [1, 2, 3], savedSetNumber: FOURTH_SET })).toBe(false);
  });

  it('не переходит при правке выполненного подхода', () => {
    expect(advance({ saved: [1, 2, 3], savedSetNumber: 2 })).toBe(false);
  });

  it('не переходит, пока плановые подходы не выполнены', () => {
    expect(advance({ saved: [1], savedSetNumber: 2 })).toBe(false);
  });

  it('переходит, когда последний недостающий плановый подход сохраняется не по порядку', () => {
    expect(advance({ saved: [1, 3], savedSetNumber: 2 })).toBe(true);
  });
});

describe('Следующий шаг после сохранения подхода: getAdvanceTarget', () => {
  const GROUP = 1;
  const SECOND_GROUP = 2;
  const TWO_SETS = 2;
  const A1 = planExercise({ id: 1, supersetGroup: GROUP });
  const A2 = planExercise({ id: 2, supersetGroup: GROUP });
  const A3 = planExercise({ id: 3, supersetGroup: GROUP });
  const NEXT = planExercise({ id: 9 });

  function sets(entries: Array<[exercise: number, setNumbers: number[]]>) {
    return entries.flatMap(([exerciseId, setNumbers]) =>
      setsOf({ workoutExerciseId: exerciseId, setNumbers }),
    );
  }

  it('[U1] после подхода A1 №1 переход к A2', () => {
    const target = getAdvanceTarget({
      exercises: [A1, A2],
      resultsBefore: [],
      currentIndex: 0,
      savedSetNumber: 1,
    });

    expect(target).toBe(1);
  });

  it('[U2] после последнего упражнения группы возврат к первому', () => {
    const target = getAdvanceTarget({
      exercises: [A1, A2],
      resultsBefore: sets([
        [1, [1, 2]],
        [2, [1]],
      ]),
      currentIndex: 1,
      savedSetNumber: 2,
    });

    expect(target).toBe(0);
  });

  it('[U3] одиночное упражнение ведёт себя как раньше', () => {
    const single = planExercise({ id: 5 });
    const exercises = [single, NEXT];
    const params = { exercises, currentIndex: 0 };

    expect(
      getAdvanceTarget({ ...params, resultsBefore: sets([[5, [1]]]), savedSetNumber: 2 }),
    ).toBeNull();
    expect(
      getAdvanceTarget({ ...params, resultsBefore: sets([[5, [1, 2]]]), savedSetNumber: 3 }),
    ).toBe(1);
  });

  it('[U4] при неравном числе подходов закрытое упражнение не предлагается', () => {
    const shortA2 = planExercise({ id: 2, sets: TWO_SETS, supersetGroup: GROUP });
    const target = getAdvanceTarget({
      exercises: [A1, shortA2],
      resultsBefore: sets([
        [1, [1, 2]],
        [2, [1]],
      ]),
      currentIndex: 1,
      savedSetNumber: 2,
    });

    expect(target).toBe(0);
  });

  it('[U5] группа из трёх упражнений замыкает цикл', () => {
    const [b1, b2, b3] = [A1, A2, A3].map((item) => ({ ...item, sets: TWO_SETS }));
    const target = getAdvanceTarget({
      exercises: [b1, b2, b3],
      resultsBefore: sets([
        [1, [1]],
        [2, [1]],
      ]),
      currentIndex: 2,
      savedSetNumber: 1,
    });

    expect(target).toBe(0);
  });

  it('[U10] группа из трёх закрывается после последнего подхода и ведёт к следующему упражнению', () => {
    const [b1, b2, b3] = [A1, A2, A3].map((item) => ({ ...item, sets: TWO_SETS }));
    const target = getAdvanceTarget({
      exercises: [b1, b2, b3, NEXT],
      resultsBefore: sets([
        [1, [1, 2]],
        [2, [1, 2]],
        [3, [1]],
      ]),
      currentIndex: 2,
      savedSetNumber: 2,
    });

    expect(target).toBe(3);
  });

  it('[U6] соседние группы не смешиваются', () => {
    const [a1, a2] = [A1, A2].map((item) => ({ ...item, sets: TWO_SETS }));
    const b1 = planExercise({ id: 3, sets: TWO_SETS, supersetGroup: SECOND_GROUP });
    const b2 = planExercise({ id: 4, sets: TWO_SETS, supersetGroup: SECOND_GROUP });
    const target = getAdvanceTarget({
      exercises: [a1, a2, b1, b2],
      resultsBefore: sets([
        [1, [1, 2]],
        [2, [1]],
      ]),
      currentIndex: 1,
      savedSetNumber: 2,
    });

    expect(target).toBe(2);
  });

  it('[U7] переход дальше только когда закрыта вся группа', () => {
    const target = getAdvanceTarget({
      exercises: [A1, A2, NEXT],
      resultsBefore: sets([
        [1, [1, 2, 3]],
        [2, [1, 2]],
      ]),
      currentIndex: 1,
      savedSetNumber: 3,
    });

    expect(target).toBe(2);
  });

  it('[U8] группа в конце тренировки не переключает дальше', () => {
    const [a1, a2] = [A1, A2].map((item) => ({ ...item, sets: TWO_SETS }));
    const target = getAdvanceTarget({
      exercises: [a1, a2],
      resultsBefore: sets([
        [1, [1, 2]],
        [2, [1]],
      ]),
      currentIndex: 1,
      savedSetNumber: 2,
    });

    expect(target).toBeNull();
  });
});

describe('Повтор упражнения: прогресс по строке плана', () => {
  const SHARED_EXERCISE_ID = 50;
  const FIRST_ROW_ID = 1;
  const SECOND_ROW_ID = 2;
  const first = planExercise({ id: FIRST_ROW_ID, exerciseId: SHARED_EXERCISE_ID });
  const second = planExercise({ id: SECOND_ROW_ID, exerciseId: SHARED_EXERCISE_ID });

  it('[U2] подходы одного вхождения не засчитываются другому', () => {
    const results = setsOf({ workoutExerciseId: FIRST_ROW_ID, setNumbers: [1, 2, 3] });

    expect(countExerciseSets({ exercise: first, results })).toBe(3);
    expect(isExerciseDone({ exercise: first, results })).toBe(true);
    expect(countExerciseSets({ exercise: second, results })).toBe(0);
    expect(isExerciseDone({ exercise: second, results })).toBe(false);
  });

  it('[U4] автопереход в суперсете с повтором идёт по строкам', () => {
    const block = planExercise({ id: 1, exerciseId: 11, sets: 2, supersetGroup: 1 });
    const lateralFirst = planExercise({ id: 2, exerciseId: 50, sets: 2, supersetGroup: 1 });
    const lateralSecond = planExercise({ id: 3, exerciseId: 50, sets: 2, supersetGroup: 2 });
    const french = planExercise({ id: 4, exerciseId: 12, sets: 2, supersetGroup: 2 });

    const target = getAdvanceTarget({
      exercises: [block, lateralFirst, lateralSecond, french],
      resultsBefore: [
        ...setsOf({ workoutExerciseId: 1, setNumbers: [1, 2] }),
        ...setsOf({ workoutExerciseId: 2, setNumbers: [1] }),
      ],
      currentIndex: 1,
      savedSetNumber: 2,
    });

    expect(target).toBe(2);
  });
});

describe('Доля выполнения упражнения: getExerciseCompletion', () => {
  const PLANNED = 4;
  const EXTRA_SET = PLANNED + 1;

  it('[fb-U7] 2 сохранённых подхода из 4 запланированных — доля 0.5', () => {
    const exercise = planExercise({ id: FIRST_ID, sets: PLANNED });
    const results = setsOf({ workoutExerciseId: FIRST_ID, setNumbers: [1, 2] });

    expect(getExerciseCompletion({ exercise, results })).toBe(0.5);
  });

  it('[fb-U8] без подходов доля 0, при всех плановых подходах доля 1', () => {
    const notStarted = planExercise({ id: FIRST_ID, sets: PLANNED });
    const done = planExercise({ id: SECOND_ID, sets: PLANNED });
    const results = setsOf({ workoutExerciseId: SECOND_ID, setNumbers: range(PLANNED) });

    expect(getExerciseCompletion({ exercise: notStarted, results })).toBe(0);
    expect(getExerciseCompletion({ exercise: done, results })).toBe(1);
  });

  it('[fb-U9] подход сверх плана вместе с плановыми не увеличивает долю выше 1', () => {
    const exercise = planExercise({ id: FIRST_ID, sets: PLANNED });
    const results = setsOf({ workoutExerciseId: FIRST_ID, setNumbers: range(EXTRA_SET) });

    expect(getExerciseCompletion({ exercise, results })).toBe(1);
  });

  it('[fb-U9] один лишь подход сверх плана не засчитывается вместо планового', () => {
    const exercise = planExercise({ id: FIRST_ID, sets: PLANNED });
    const results = setsOf({ workoutExerciseId: FIRST_ID, setNumbers: [EXTRA_SET] });

    expect(getExerciseCompletion({ exercise, results })).toBe(0);
  });
});

describe('Цель автоперехода для отсчёта', () => {
  const plain = [planExercise({ id: 1 }), planExercise({ id: 2 }), planExercise({ id: 3 })];
  const pair = [
    planExercise({ id: 1, supersetGroup: 1 }),
    planExercise({ id: 2, supersetGroup: 1 }),
    planExercise({ id: 3 }),
  ];

  it('[rf-U6] после последнего планового подхода обычного упражнения целью становится следующее', () => {
    const target = getAdvanceTarget({
      exercises: plain,
      resultsBefore: setsOf({ workoutExerciseId: 1, setNumbers: [1, 2] }),
      currentIndex: 0,
      savedSetNumber: 3,
    });

    expect(target).toBe(1);
  });

  it.each([
    {
      title: 'последнего упражнения',
      currentIndex: 2,
      resultsBefore: setsOf({ workoutExerciseId: 3, setNumbers: [1, 2] }),
      savedSetNumber: 3,
    },
    {
      title: 'правки уже сохранённого подхода',
      currentIndex: 0,
      resultsBefore: setsOf({ workoutExerciseId: 1, setNumbers: [1, 2, 3] }),
      savedSetNumber: 2,
    },
  ])('[rf-U7] цели нет после $title', ({ currentIndex, resultsBefore, savedSetNumber }) => {
    expect(
      getAdvanceTarget({ exercises: plain, resultsBefore, currentIndex, savedSetNumber }),
    ).toBeNull();
  });

  it.each([
    {
      title: 'из первого во второе',
      currentIndex: 0,
      resultsBefore: [],
      savedSetNumber: 1,
      target: 1,
    },
    {
      title: 'из второго в первое',
      currentIndex: 1,
      resultsBefore: setsOf({ workoutExerciseId: 1, setNumbers: [1] }),
      savedSetNumber: 1,
      target: 0,
    },
  ])(
    '[rf-U8] в суперсете цель — упражнение группы $title',
    ({ currentIndex, resultsBefore, savedSetNumber, target }) => {
      expect(
        getAdvanceTarget({ exercises: pair, resultsBefore, currentIndex, savedSetNumber }),
      ).toBe(target);
    },
  );
});
