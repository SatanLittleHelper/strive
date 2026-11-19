import { describe, expect, it } from 'vitest';
import { planExercise, range, setsOf } from '../test-support/session.fixtures';
import { getEditorSet } from './editor-set.helpers';

const EXERCISE_ID = 7;
const PLANNED_SETS = 3;
const EXTRA_SET_NUMBER = 4;
const NO_FORM = { mode: 'none', setNumber: null };
const exercise = planExercise({ id: EXERCISE_ID });

function editorFor({ saved, selected = null }: { saved: number[]; selected?: number | null }) {
  return getEditorSet({
    exercise,
    results: setsOf({ workoutExerciseId: EXERCISE_ID, setNumbers: saved }),
    selected,
  });
}

describe('Подход для формы', () => {
  it('форма открывается на первом несохранённом плановом подходе', () => {
    expect(editorFor({ saved: [1, 2] })).toEqual({ mode: 'plan', setNumber: 3 });
  });

  it('выбранный номер, которого нет среди сохранённых, игнорируется', () => {
    expect(editorFor({ saved: [1, 2], selected: 3 })).toEqual({ mode: 'plan', setNumber: 3 });
  });

  it('[rf-U1] выполненное упражнение не открывает форму', () => {
    expect(editorFor({ saved: range(PLANNED_SETS) })).toEqual(NO_FORM);
  });

  it('[rf-U2] подход сверх плана не мешает «нет формы»', () => {
    expect(editorFor({ saved: [...range(PLANNED_SETS), EXTRA_SET_NUMBER] })).toEqual(NO_FORM);
  });

  it('[rf-U3] правка сохранённого подхода работает как раньше', () => {
    expect(editorFor({ saved: range(PLANNED_SETS), selected: 2 })).toEqual({
      mode: 'edit',
      setNumber: 2,
    });
  });
});
