import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@/features/auth';
import { configureZonelessTestingModule } from '@/test-setup';
import { LoginComponent } from './login.component';
import type { ComponentFixture } from '@angular/core/testing';
import type { FormGroup } from '@angular/forms';

class TestLoginComponent extends LoginComponent {
  public getForm(): FormGroup {
    return this.form;
  }

  public callOnSubmit(): void {
    return this.onSubmit();
  }

  public callGetLastError(): string | null {
    return this.getLastError();
  }
}

describe('LoginComponent', () => {
  let component: TestLoginComponent;
  let fixture: ComponentFixture<TestLoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login$', 'clearError'], {
      loading: jasmine.createSpy().and.returnValue(false),
      error: jasmine.createSpy().and.returnValue(null),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: of() });
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { queryParams: {} },
      queryParams: of({}),
      params: of({}),
      url: of([]),
    });

    configureZonelessTestingModule({
      imports: [ReactiveFormsModule, TestLoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: RouterLink, useValue: {} },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(TestLoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.getForm().get('email')?.value).toBe('');
    expect(component.getForm().get('password')?.value).toBe('');
  });

  it('should have required validators on email field', () => {
    const emailControl = component.getForm().get('email');

    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);

    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('required')).toBe(false);
  });

  it('should have email pattern validator', () => {
    const emailControl = component.getForm().get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('pattern')).toBe(true);

    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('pattern')).toBe(false);
  });

  it('should have required validator on password field', () => {
    const passwordControl = component.getForm().get('password');

    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBe(true);

    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('required')).toBe(false);
  });

  it('should have minlength validator on password field', () => {
    const passwordControl = component.getForm().get('password');

    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should have pattern validator on password field', () => {
    const passwordControl = component.getForm().get('password');

    passwordControl?.setValue('password');
    expect(passwordControl?.hasError('pattern')).toBe(true);

    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('pattern')).toBe(false);
  });

  it('should not submit form when invalid', () => {
    component.getForm().patchValue({
      email: 'invalid-email',
      password: '123',
    });

    component.callOnSubmit();

    expect(authService.login$).not.toHaveBeenCalled();
  });

  it('should submit form when valid', () => {
    component.getForm().patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    authService.login$.and.returnValue(of(undefined));

    component.callOnSubmit();

    expect(authService.login$).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should clear error when form values change', () => {
    component.getForm().patchValue({
      email: 'test@example.com',
    });

    expect(authService.clearError).toHaveBeenCalled();
  });

  it('should show backend error when available', () => {
    authService.error.and.returnValue('Invalid credentials');

    const error = component.callGetLastError();

    expect(error).toBe('Invalid credentials');
  });

  it('should show first validation error when no backend error', () => {
    authService.error.and.returnValue(null);

    component.getForm().patchValue({
      email: '',
      password: '',
    });
    component.getForm().markAllAsTouched();

    const error = component.callGetLastError();

    expect(error).toBe('required');
  });

  it('should return null when no errors', () => {
    authService.error.and.returnValue(null);

    component.getForm().patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    const error = component.callGetLastError();

    expect(error).toBeNull();
  });

  it('should handle login error', () => {
    component.getForm().patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    authService.login$.and.returnValue(of(undefined));

    component.callOnSubmit();

    expect(authService.login$).toHaveBeenCalled();
  });
});
