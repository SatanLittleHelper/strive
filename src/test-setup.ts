import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Provider } from '@angular/core';

export function configureZonelessTestingModule(
  config: { providers?: Provider[]; imports?: unknown[] } = {},
): void {
  TestBed.configureTestingModule({
    ...config,
    providers: [provideExperimentalZonelessChangeDetection(), ...(config.providers || [])],
  });
}

export function createServiceInInjectionContext<T>(token: unknown): T {
  return TestBed.runInInjectionContext(() => TestBed.inject(token as never));
}
