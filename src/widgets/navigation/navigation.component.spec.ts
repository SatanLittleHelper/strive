import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AuthService } from '@/features/auth';
import { ThemeService, UserStoreService } from '@/shared';
import { configureZonelessTestingModule } from '@/test-setup';

import { NavigationComponent } from './navigation.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let userStoreService: jasmine.SpyObj<UserStoreService>;

  beforeEach((): void => {
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDark: jasmine.createSpy().and.returnValue(false),
    });
    const userStoreSpy = jasmine.createSpyObj('UserStoreService', ['clearUser'], {
      user: jasmine.createSpy().and.returnValue(null),
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
    });
    const authSpy = jasmine.createSpyObj('AuthService', ['logout']);

    configureZonelessTestingModule({
      imports: [NavigationComponent, TuiButton, TuiIcon],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: UserStoreService, useValue: userStoreSpy },
        { provide: AuthService, useValue: authSpy },
        provideHttpClientTesting(),
      ],
    });

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    userStoreService = TestBed.inject(UserStoreService) as jasmine.SpyObj<UserStoreService>;
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

  it('should expose userStore signals', (): void => {
    expect(component['isAuthenticated']).toBe(userStoreService.isAuthenticated);
    expect(component['user']).toBe(userStoreService.user);
  });

  it('should render navigation structure correctly when authenticated', (): void => {
    userStoreService.isAuthenticated.and.returnValue(true);
    userStoreService.user.and.returnValue({ id: '1', email: 'test@example.com', theme: 'light' });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.navigation')).toBeTruthy();
    expect(compiled.querySelector('.navigation-content')).toBeTruthy();
    expect(compiled.querySelector('.navigation-nav')).toBeTruthy();
  });
});
