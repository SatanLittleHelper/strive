import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Provider, EnvironmentProviders } from '@angular/core';

export function configureZonelessTestingModule(
  config: { providers?: Array<Provider | EnvironmentProviders>; imports?: unknown[] } = {},
): void {
  TestBed.configureTestingModule({
    ...config,
    providers: [provideExperimentalZonelessChangeDetection(), ...(config.providers || [])],
  });
}
