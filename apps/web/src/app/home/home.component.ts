import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContinueBannerComponent } from '../sessions/continue-banner';

@Component({
  selector: 'app-home',
  imports: [ContinueBannerComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomeComponent {}
