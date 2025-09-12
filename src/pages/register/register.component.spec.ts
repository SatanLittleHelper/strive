import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '@/features/auth';
import type { ApiError } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { RegisterComponent } from './register.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register$', 'clearError']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    configureZonelessTestingModule();

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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
    expect((component as any).form.get('confirm_password')?.value).toBe('');
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

  it('should have required validator on confirm_password field', () => {
    const confirmPasswordControl = (component as any).form.get('confirm_password');

    confirmPasswordControl?.setValue('');
    expect(confirmPasswordControl?.hasError('required')).toBe(true);

    confirmPasswordControl?.setValue('password123');
    expect(confirmPasswordControl?.hasError('required')).toBe(false);
  });

  it('should have passwordMismatch validator when passwords do not match', () => {
    (component as any).form.patchValue({
      password: 'password123',
      confirm_password: 'differentpassword',
    });

    expect((component as any).form.hasError('passwordMismatch')).toBe(true);
  });

  it('should not have passwordMismatch validator when passwords match', () => {
    (component as any).form.patchValue({
      password: 'password123',
    });

    expect((component as any).form.hasError('passwordMismatch')).toBe(false);
  });

  it('should not submit form when invalid', () => {
    (component as any).form.patchValue({
      email: 'invalid-email',
      password: '123',
      confirm_password: 'different',
    });

    (component as any).onSubmit();

    expect(authService.register$).not.toHaveBeenCalled();
  });

  it('should submit form when valid', () => {
    (component as any).form.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    authService.register$.and.returnValue(of(undefined));

    (component as any).onSubmit();

    expect(authService.register$).toHaveBeenCalledWith({
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
      get: () => 'Email already exists',
      configurable: true,
    });

    const error = (component as any).getLastError();

    expect(error).toBe('Email already exists');
  });

  it('should show first validation error when no backend error', () => {
    Object.defineProperty(authService, 'error', {
      get: () => null,
      configurable: true,
    });

    (component as any).form.patchValue({
      email: '',
      password: '',
      confirm_password: '',
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

  it('should handle registration error', () => {
    (component as any).form.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    const apiError: ApiError = {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Email is already registered',
    };

    authService.register$.and.returnValue(throwError(() => apiError));

    (component as any).onSubmit();

    expect(authService.register$).toHaveBeenCalled();
  });
});
