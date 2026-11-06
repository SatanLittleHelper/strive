import { describe, expect, it } from 'vitest';
import { getPrimaryAction } from './primary-action.helpers';

describe('Главное действие нижней кнопки', () => {
  it('пока форма открыта — сохранить', () => {
    expect(getPrimaryAction({ hasForm: true, isLastExercise: false, sessionDone: false })).toBe(
      'save',
    );
  });

  it('на выполненном не последнем упражнении — следующее упражнение', () => {
    expect(getPrimaryAction({ hasForm: false, isLastExercise: false, sessionDone: false })).toBe(
      'next',
    );
  });

  it('на выполненном последнем упражнении — завершить', () => {
    expect(getPrimaryAction({ hasForm: false, isLastExercise: true, sessionDone: false })).toBe(
      'finish',
    );
  });

  it('когда выполнены все упражнения — завершить', () => {
    expect(getPrimaryAction({ hasForm: false, isLastExercise: false, sessionDone: true })).toBe(
      'finish',
    );
  });
});
