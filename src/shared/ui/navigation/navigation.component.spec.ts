import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { ThemeService } from '@/shared';
import { configureZonelessTestingModule } from '@/test-setup';

import { NavigationComponent } from './navigation.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let themeService: jasmine.SpyObj<ThemeService>;

  beforeEach((): void => {
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme', 'isDark']);

    configureZonelessTestingModule({
      imports: [NavigationComponent, TuiButton, TuiIcon],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: ThemeService, useValue: themeServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
  });

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  it('should have correct navigation items', (): void => {
    expect(component['navigationItems']).toBeDefined();
    expect(component['navigationItems'].length).toBe(2);
    expect(component['navigationItems'][0].route).toBe('/dashboard');
    expect(component['navigationItems'][1].route).toBe('/calorie-calculator');
  });

  it('should call themeService.toggleTheme when toggleTheme is called', (): void => {
    (component as unknown as { toggleTheme: () => void }).toggleTheme();
    expect(themeService.toggleTheme).toHaveBeenCalled();
  });

  it('should return themeService.isDark signal when isDark is accessed', (): void => {
    expect((component as unknown as { isDark: unknown }).isDark).toBe(themeService.isDark);
  });

  it('should render navigation structure correctly', (): void => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.navigation')).toBeTruthy();
    expect(compiled.querySelector('.navigation-content')).toBeTruthy();
    expect(compiled.querySelector('.navigation-nav')).toBeTruthy();
  });
});
