import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';

import { type ActivityData, ActivityLevel, Goal } from '@/features/calorie-calculation';
import { generateSelectOptions, SelectFieldComponent } from '@/shared';

import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-activity-goal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TuiButton, SelectFieldComponent],
  templateUrl: './activity-goal-form.component.html',
  styleUrl: './activity-goal-form.component.scss',
})
export class ActivityGoalFormComponent implements OnInit {
  readonly initialData = input<ActivityData | null>(null);
  readonly dataSubmitted = output<ActivityData>();
  readonly dataChanged = output<void>();

  protected readonly activityLevelOptions = computed(() => generateSelectOptions(ActivityLevel));
  protected readonly goalOptions = computed(() => generateSelectOptions(Goal));

  readonly form = new FormGroup({
    activityLevel: new FormControl<string | null>(null, [Validators.required]),
    goal: new FormControl<string | null>(null, [Validators.required]),
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
      this.dataSubmitted.emit(this.form.getRawValue() as ActivityData);
    }
  }
}
