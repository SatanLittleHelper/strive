import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '@/features/auth';
import type { ApiError } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { LoginComponent } from './login.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login$', 'clearError']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule();

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    TestBed.inject(Router);

    Object.defineProperty(authService, 'loading', {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(authService, 'error', {
      get: () => null,
      configurable: true,
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect((component as any).form.get('email')?.value).toBe('');
    expect((component as any).form.get('password')?.value).toBe('');
  });

  it('should have required validators on email field', () => {
    const emailControl = (component as any).form.get('email');

    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);

    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('required')).toBe(false);
  });

  it('should have email pattern validator', () => {
    const emailControl = (component as any).form.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('pattern')).toBe(true);

    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('pattern')).toBe(false);
  });

  it('should have required validator on password field', () => {
    const passwordControl = (component as any).form.get('password');

    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBe(true);

    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('required')).toBe(false);
  });

  it('should have minlength validator on password field', () => {
    const passwordControl = (component as any).form.get('password');

    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should have pattern validator on password field', () => {
    const passwordControl = (component as any).form.get('password');

    passwordControl?.setValue('password');
    expect(passwordControl?.hasError('pattern')).toBe(true);

    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('pattern')).toBe(false);
  });

  it('should not submit form when invalid', () => {
    (component as any).form.patchValue({
      email: 'invalid-email',
      password: '123',
    });

    (component as any).onSubmit();

    expect(authService.login$).not.toHaveBeenCalled();
  });

  it('should submit form when valid', () => {
    (component as any).form.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    authService.login$.and.returnValue(of(undefined));

    (component as any).onSubmit();

    expect(authService.login$).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should clear error when form values change', () => {
    (component as any).form.patchValue({
      email: 'test@example.com',
    });

    expect(authService.clearError).toHaveBeenCalled();
  });

  it('should show backend error when available', () => {
    Object.defineProperty(authService, 'error', {
      get: () => 'Invalid credentials',
      configurable: true,
    });

    const error = (component as any).getLastError();

    expect(error).toBe('Invalid credentials');
  });

  it('should show first validation error when no backend error', () => {
    Object.defineProperty(authService, 'error', {
      get: () => null,
      configurable: true,
    });

    (component as any).form.patchValue({
      email: '',
      password: '',
    });
    (component as any).form.markAllAsTouched();

    const error = (component as any).getLastError();

    expect(error).toBe('required');
  });

  it('should return null when no errors', () => {
    Object.defineProperty(authService, 'error', {
      get: () => null,
      configurable: true,
    });

    (component as any).form.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    const error = (component as any).getLastError();

    expect(error).toBeNull();
  });

  it('should handle login error', () => {
    (component as any).form.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    const apiError: ApiError = {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    };

    authService.login$.and.returnValue(throwError(() => apiError));

    (component as any).onSubmit();

    expect(authService.login$).toHaveBeenCalled();
  });
});
