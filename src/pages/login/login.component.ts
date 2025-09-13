import { Component, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { AuthService, type LoginRequest } from '@/features/auth';
import type { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TuiTextfield, TuiButton, TuiLabel],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form: FormGroup;
  protected readonly loading = this.authService.loading;
  protected readonly error = this.authService.error;

  constructor() {
    this.form = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/),
        ],
      ],
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.authService.clearError());
  }

  protected getLastError(): string | null {
    const backendError = this.error();
    if (backendError) {
      return backendError;
    }

    const errorControl = Object.values(this.form.controls).find(
      (control) => control.touched && control.errors,
    );

    return errorControl ? Object.keys(errorControl.errors!)[0] : null;
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const loginData: LoginRequest = {
        email: this.form.value.email,
        password: this.form.value.password,
      };

      this.authService.login$(loginData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }
}
