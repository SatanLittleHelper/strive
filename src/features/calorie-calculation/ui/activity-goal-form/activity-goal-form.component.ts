import { ChangeDetectionStrategy, Component, input, output, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiDataList, tuiItemsHandlersProvider, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiSelect } from '@taiga-ui/kit';
import { Subject, takeUntil } from 'rxjs';

import { type ActivityData, ActivityLevel, Goal } from '@/features/calorie-calculation';
import type { SelectOption } from '@/shared';
import {
  generateSelectOptions,
  identityMatcherSelectOption,
  stringifySelectOptionByValue,
} from '@/shared';

import type { OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-activity-goal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TuiButton, TuiTextfield, TuiSelect, TuiDataList, TuiChevron],
  providers: [
    tuiItemsHandlersProvider({
      stringify: signal((x: SelectOption): string =>
        x.description ? `${x.label} (${x.description})` : x.label,
      ),
      identityMatcher: signal(identityMatcherSelectOption),
    }),
  ],
  templateUrl: './activity-goal-form.component.html',
  styleUrl: './activity-goal-form.component.scss',
})
export class ActivityGoalFormComponent implements OnInit, OnDestroy {
  readonly initialData = input<ActivityData | null>(null);
  readonly dataSubmitted = output<ActivityData>();
  readonly dataChanged = output<void>();

  private readonly destroy$ = new Subject<void>();

  protected readonly activityLevelOptions = computed(() =>
    generateSelectOptions(ActivityLevel).map((option) => ({
      ...option,
      displayText: stringifySelectOptionByValue(generateSelectOptions(ActivityLevel), option.value),
    })),
  );

  protected readonly goalOptions = computed(() =>
    generateSelectOptions(Goal).map((option) => ({
      ...option,
      displayText: stringifySelectOptionByValue(generateSelectOptions(Goal), option.value),
    })),
  );

  protected readonly stringifyActivityLevel = (item: string): string =>
    stringifySelectOptionByValue(generateSelectOptions(ActivityLevel), item);
  protected readonly stringifyGoal = (item: string): string =>
    stringifySelectOptionByValue(generateSelectOptions(Goal), item);

  readonly form = new FormGroup({
    activityLevel: new FormControl<string | null>(null, [Validators.required]),
    goal: new FormControl<string | null>(null, [Validators.required]),
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
      this.dataSubmitted.emit(this.form.getRawValue() as ActivityData);
    }
  }
}
