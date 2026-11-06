import { describe, expect, it } from 'vitest';
import { planExercise, range, setsOf } from '../test-support/session.fixtures';
import { getEditorSet } from './editor-set.helpers';

const EXERCISE_ID = 7;
const PLANNED_SETS = 3;
const EXTRA_SET_NUMBER = 4;
const exercise = planExercise({ id: EXERCISE_ID });

function editorFor({
  saved,
  selected = null,
  adding = false,
}: {
  saved: number[];
  selected?: number | null;
  adding?: boolean;
}) {
  return getEditorSet({
    exercise,
    results: setsOf({ exerciseId: EXERCISE_ID, setNumbers: saved }),
    selected,
    adding,
  });
}

describe('Подход для формы', () => {
  it('форма открывается на первом несохранённом плановом подходе', () => {
    expect(editorFor({ saved: [1, 2] })).toEqual({ mode: 'plan', setNumber: 3 });
  });

  it('выбранный сохранённый подход открывается на правку', () => {
    expect(editorFor({ saved: [1, 2], selected: 1 })).toEqual({ mode: 'edit', setNumber: 1 });
  });

  it('когда все плановые подходы сохранены и выбора нет, формы нет', () => {
    expect(editorFor({ saved: range(PLANNED_SETS) })).toEqual({ mode: 'none', setNumber: null });
  });

  it('запрос добавления открывает подход после последнего сохранённого', () => {
    expect(editorFor({ saved: range(PLANNED_SETS), adding: true })).toEqual({
      mode: 'extra',
      setNumber: EXTRA_SET_NUMBER,
    });
  });

  it('выбранный номер, которого нет среди сохранённых, игнорируется', () => {
    expect(editorFor({ saved: [1, 2], selected: 3 })).toEqual({ mode: 'plan', setNumber: 3 });
  });
});
