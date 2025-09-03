import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

export function configureZonelessTestingModule(
  config: { providers?: unknown[]; imports?: unknown[] } = {},
): void {
  TestBed.configureTestingModule({
    ...config,
    providers: [provideExperimentalZonelessChangeDetection(), ...(config.providers || [])],
  });
}

export function createServiceInInjectionContext<T>(token: unknown): T {
  return TestBed.runInInjectionContext(() => TestBed.inject(token as never));
}
