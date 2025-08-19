import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { WorkoutEntity } from '@/entities/workout';
import { WorkoutInfoComponent } from '@/entities/workout';

@Component({
  selector: 'app-next-workout-widget',
  templateUrl: './next-workout-widget.component.html',
  styleUrls: ['./next-workout-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'next-workout-widget' },
  imports: [WorkoutInfoComponent],
})
export class NextWorkoutWidgetComponent {
  readonly workouts = signal<WorkoutEntity[]>([
    { id: 1, name: 'Push Day', date: '2025-08-01', completedPercent: 100 },
    { id: 2, name: 'Pull Day', date: '2025-08-09', completedPercent: 0 },
    { id: 3, name: 'Legs', date: '2025-08-12', completedPercent: 0 },
  ]);
}
