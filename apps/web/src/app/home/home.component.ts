import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TuiTitle } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { getResourceViewState } from '../api/resource-view-state';
import { ContinueBannerComponent } from '../sessions/continue-banner';
import { ResourceStateComponent } from '../shared/resource-state';
import { HomeApiService } from './home.api.service';
import { NextWorkoutComponent } from './next-workout';

@Component({
  selector: 'app-home',
  imports: [
    ContinueBannerComponent,
    NextWorkoutComponent,
    ResourceStateComponent,
    TuiCardLarge,
    TuiHeader,
    TuiSkeleton,
    TuiTitle,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomeComponent {
  private readonly home = inject(HomeApiService).getHome();
  protected readonly card = computed(() => (this.home.hasValue() ? this.home.value() : undefined));
  protected readonly state = computed(() =>
    getResourceViewState({
      status: this.home.status(),
      isEmpty: !this.card() || this.card()?.kind === 'empty',
    }),
  );

  protected reload(): void {
    this.home.reload();
  }
}
