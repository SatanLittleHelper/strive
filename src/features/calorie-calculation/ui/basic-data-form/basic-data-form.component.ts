import { ChangeDetectionStrategy, Component, input, output, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber } from '@taiga-ui/kit';

import {
  type BasicData,
  GenderOptions,
  DEFAULT_BASIC_DATA,
  isBasicData,
} from '@/features/calorie-calculation';
import {
  generateSelectOptions,
  SelectFieldComponent,
  SectionBlockComponent,
  FormAutosaveDirective,
} from '@/shared';

import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-basic-data-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiInputNumber,
    TuiTextfield,
    SelectFieldComponent,
    SectionBlockComponent,
    FormAutosaveDirective,
  ],

  templateUrl: './basic-data-form.component.html',
  styleUrl: './basic-data-form.component.scss',
})
export class BasicDataFormComponent implements OnInit {
  readonly initialData = input<BasicData | null>(null);
  readonly dataSubmitted = output<BasicData>();
  readonly dataChanged = output<void>();

  protected readonly genderOptions = computed(() => generateSelectOptions(GenderOptions));

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    gender: [DEFAULT_BASIC_DATA.gender, [Validators.required]],
    age: [DEFAULT_BASIC_DATA.age, [Validators.required, Validators.min(10), Validators.max(120)]],
    height: [
      DEFAULT_BASIC_DATA.height,
      [Validators.required, Validators.min(100), Validators.max(250)],
    ],
    weight: [
      DEFAULT_BASIC_DATA.weight,
      [Validators.required, Validators.min(30), Validators.max(300)],
    ],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.dataChanged.emit();
    });
  }

  ngOnInit(): void {
    const data = this.initialData();
    if (data) {
      this.form.patchValue(data);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();

      if (!isBasicData(formValue)) {
        throw new Error('Form data is not valid BasicData');
      }

      this.dataSubmitted.emit(formValue);
    }
  }
}
