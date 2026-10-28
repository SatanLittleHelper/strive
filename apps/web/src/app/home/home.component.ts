import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HealthService } from '../health/health.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomeComponent {
  protected readonly health = inject(HealthService);
}
