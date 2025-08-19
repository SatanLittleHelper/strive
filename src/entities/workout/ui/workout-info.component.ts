import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { WorkoutEntity } from '@/entities/workout';

@Component({
  selector: 'app-workout-info',
  templateUrl: './workout-info.component.html',
  styleUrls: ['./workout-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'workout-info' },
  imports: [DatePipe],
})
export class WorkoutInfoComponent {
  workout = input.required<WorkoutEntity>();

  readonly percentClass = computed(() => {
    const percent = this.workout().completedPercent;
    if (percent === 0) return 'percent-default';
    if (percent > 80) return 'percent-success';
    if (percent > 25) return 'percent-warning';
    return 'percent-error';
  });
}
