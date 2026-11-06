import { SET_RESULT_LIMITS } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import { planExercise, range, sessionOf, setsOf } from '../test-support/session.fixtures';
import {
  canAddSet,
  countExerciseSets,
  getRingMax,
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
      ...setsOf({ exerciseId: FIRST_ID, setNumbers: [1, 2] }),
      ...setsOf({ exerciseId: SECOND_ID, setNumbers: [1] }),
    ];

    expect(countExerciseSets({ exercise: first, results })).toBe(2);
    expect(countExerciseSets({ exercise: second, results })).toBe(1);
  });

  it('шкала кольца — большее из плана и сохранённых подходов', () => {
    const twoSaved = setsOf({ exerciseId: FIRST_ID, setNumbers: [1, 2] });
    const fourSaved = setsOf({ exerciseId: FIRST_ID, setNumbers: range(FOURTH_SET) });

    expect(getRingMax({ exercise: first, results: twoSaved })).toBe(PLANNED_SETS);
    expect(getRingMax({ exercise: first, results: fourSaved })).toBe(FOURTH_SET);
  });

  it('упражнение выполнено, когда сохранены все плановые подходы и есть дополнительные', () => {
    const results = setsOf({ exerciseId: FIRST_ID, setNumbers: range(FOURTH_SET) });

    expect(isExerciseDone({ exercise: first, results })).toBe(true);
  });

  it('упражнение не выполнено, пока не хватает планового подхода', () => {
    const results = setsOf({ exerciseId: FIRST_ID, setNumbers: [1, 2] });

    expect(isExerciseDone({ exercise: first, results })).toBe(false);
  });

  it('тренировка не выполнена, пока в одном упражнении не хватает подхода, даже при дополнительных в другом', () => {
    const results = [
      ...setsOf({ exerciseId: FIRST_ID, setNumbers: range(FOURTH_SET) }),
      ...setsOf({ exerciseId: SECOND_ID, setNumbers: range(PLANNED_SETS) }),
      ...setsOf({ exerciseId: THIRD_ID, setNumbers: [1, 2] }),
    ];

    expect(isSessionDone(sessionOf({ exercises: [first, second, third], results }))).toBe(false);
  });

  it('тренировка выполнена, когда выполнены все упражнения плана', () => {
    const results = [FIRST_ID, SECOND_ID, THIRD_ID].flatMap((exerciseId) =>
      setsOf({ exerciseId, setNumbers: range(PLANNED_SETS) }),
    );

    expect(isSessionDone(sessionOf({ exercises: [first, second, third], results }))).toBe(true);
  });

  it('добавление подхода недоступно на пределе', () => {
    const limit = SET_RESULT_LIMITS.setNumberMax;
    const atLimit = setsOf({ exerciseId: FIRST_ID, setNumbers: range(limit) });
    const belowLimit = setsOf({ exerciseId: FIRST_ID, setNumbers: range(limit - 1) });

    expect(canAddSet({ exercise: first, results: atLimit })).toBe(false);
    expect(canAddSet({ exercise: first, results: belowLimit })).toBe(true);
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
      resultsBefore: setsOf({ exerciseId: FIRST_ID, setNumbers: saved }),
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
