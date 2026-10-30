import type { ResourceStatus } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { getResourceViewState } from './resource-view-state';
import type { ResourceViewState } from './resource-view-state.types';

const CASES: [ResourceStatus, boolean, ResourceViewState][] = [
  ['idle', true, 'loading'],
  ['loading', true, 'loading'],
  ['error', true, 'error'],
  ['error', false, 'error'],
  ['reloading', false, 'ready'],
  ['reloading', true, 'loading'],
  ['resolved', true, 'empty'],
  ['resolved', false, 'ready'],
  ['local', true, 'empty'],
  ['local', false, 'ready'],
];

describe('getResourceViewState', () => {
  it.each(CASES)('статус %s, пусто: %s → %s', (status, isEmpty, expected) => {
    expect(getResourceViewState({ status, isEmpty })).toBe(expected);
  });
});
