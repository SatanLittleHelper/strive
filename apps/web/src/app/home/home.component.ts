import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SessionsService } from '../sessions';
import { ContinueBannerComponent } from '../sessions/continue-banner';
import { NextWorkoutComponent } from './next-workout';

@Component({
  selector: 'app-home',
  imports: [ContinueBannerComponent, NextWorkoutComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomeComponent {
  private readonly active = inject(SessionsService).active;

  // пока идёт или грузится тренировка, следующая не нужна; до ответа сервера карточку не показываем
  protected readonly showNextWorkout = computed(
    () => !this.active.isLoading() && !(this.active.hasValue() && this.active.value().session),
  );
}
