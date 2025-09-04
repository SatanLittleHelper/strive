import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber } from '@taiga-ui/kit';
import { Subject, takeUntil } from 'rxjs';

import { type BasicData, GenderOptions, type Gender } from '@/features/calorie-calculation';
import { generateSelectOptions, SelectFieldComponent } from '@/shared';

import type { OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-basic-data-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TuiButton, TuiInputNumber, TuiTextfield, SelectFieldComponent],

  templateUrl: './basic-data-form.component.html',
  styleUrl: './basic-data-form.component.scss',
})
export class BasicDataFormComponent implements OnInit, OnDestroy {
  readonly initialData = input<BasicData | null>(null);
  readonly dataSubmitted = output<BasicData>();
  readonly dataChanged = output<void>();

  protected readonly genderOptions = computed(() => generateSelectOptions(GenderOptions));

  private readonly destroy$ = new Subject<void>();

  readonly form = new FormGroup({
    gender: new FormControl<Gender | null>(null, [Validators.required]),
    age: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(10),
      Validators.max(120),
    ]),
    height: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(100),
      Validators.max(250),
    ]),
    weight: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(30),
      Validators.max(300),
    ]),
  });

  ngOnInit(): void {
    const data = this.initialData();
    if (data) {
      this.form.patchValue(data);
    }

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.dataChanged.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dataSubmitted.emit(this.form.getRawValue() as BasicData);
    }
  }
}
