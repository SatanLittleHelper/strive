import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CalorieWidgetComponent } from '@/widgets/calorie-widget';
import { NextWorkoutWidgetComponent } from '@/widgets/next-workout';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dashboard',
  },
  imports: [NextWorkoutWidgetComponent, CalorieWidgetComponent],
})
export class DashboardComponent {
  private readonly tasks = signal([
    { id: 1, title: 'Task 1', completed: true },
    { id: 2, title: 'Task 2', completed: false },
    { id: 3, title: 'Task 3', completed: true },
  ]);

  readonly tasksCount = computed(() => this.tasks().length);
  readonly completedCount = computed(() => this.tasks().filter((t) => t.completed).length);
}
