import { ChangeDetectionStrategy, Component, input, output, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';

import {
  type ActivityData,
  ActivityLevelOptions,
  GoalOptions,
  DEFAULT_ACTIVITY_DATA,
  isActivityData,
} from '@/features/calorie-calculation';
import {
  generateSelectOptions,
  SelectFieldComponent,
  SectionBlockComponent,
  FormAutosaveDirective,
} from '@/shared';

import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-activity-goal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TuiButton,
    SelectFieldComponent,
    SectionBlockComponent,
    FormAutosaveDirective,
  ],
  templateUrl: './activity-goal-form.component.html',
  styleUrl: './activity-goal-form.component.scss',
})
export class ActivityGoalFormComponent implements OnInit {
  readonly initialData = input<ActivityData | null>(null);
  readonly dataSubmitted = output<ActivityData>();
  readonly dataChanged = output<void>();

  protected readonly activityLevelOptions = computed(() =>
    generateSelectOptions(ActivityLevelOptions),
  );
  protected readonly goalOptions = computed(() => generateSelectOptions(GoalOptions));

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    activityLevel: [DEFAULT_ACTIVITY_DATA.activityLevel, [Validators.required]],
    goal: [DEFAULT_ACTIVITY_DATA.goal, [Validators.required]],
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

      if (!isActivityData(formValue)) {
        throw new Error('Form data is not valid ActivityData');
      }

      this.dataSubmitted.emit(formValue);
    }
  }
}
