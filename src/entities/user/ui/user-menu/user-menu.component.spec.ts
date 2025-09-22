import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { UserStoreService, ThemeService } from '@/shared';
import type { User } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { UserMenuComponent } from './user-menu.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('UserMenuComponent', () => {
  let component: UserMenuComponent;
  let fixture: ComponentFixture<UserMenuComponent>;
  let userStoreService: jasmine.SpyObj<UserStoreService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let mockUser: User;

  beforeEach(() => {
    const userStoreSpy = jasmine.createSpyObj('UserStoreService', ['clearUser'], {
      user: jasmine.createSpy().and.returnValue(null),
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
    });
    const themeSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDark: jasmine.createSpy().and.returnValue(false),
    });

    configureZonelessTestingModule({
      imports: [UserMenuComponent, TuiButton, TuiIcon],
      providers: [
        { provide: UserStoreService, useValue: userStoreSpy },
        { provide: ThemeService, useValue: themeSpy },
        provideHttpClientTesting(),
      ],
    });

    fixture = TestBed.createComponent(UserMenuComponent);
    component = fixture.componentInstance;
    userStoreService = TestBed.inject(UserStoreService) as jasmine.SpyObj<UserStoreService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    mockUser = { id: '1', email: 'test@example.com', theme: 'light' };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleTheme', () => {
    it('should toggle theme and close dropdown', () => {
      component['open'] = true;

      component['toggleTheme']();

      expect(themeService.toggleTheme).toHaveBeenCalled();
      expect(component['open']).toBeFalse();
    });
  });

  describe('logout', () => {
    it('should logout and close dropdown', () => {
      component['open'] = true;
      spyOn(component['logout'], 'emit');

      component['onLogout']();

      expect(component['logout'].emit).toHaveBeenCalled();
      expect(component['open']).toBeFalse();
    });
  });

  it('should render user menu structure correctly', () => {
    userStoreService.isAuthenticated.and.returnValue(true);
    userStoreService.user.and.returnValue(mockUser);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.user-menu')).toBeTruthy();
  });
});
