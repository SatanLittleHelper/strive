import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HealthService } from '../health/health.service';
import { ContinueBannerComponent } from '../sessions/continue-banner';

@Component({
  selector: 'app-home',
  imports: [ContinueBannerComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomeComponent {
  protected readonly health = inject(HealthService);
}
