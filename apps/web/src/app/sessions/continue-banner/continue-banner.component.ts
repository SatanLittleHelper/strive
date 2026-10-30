import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { SessionsService } from '..';

@Component({
  selector: 'app-continue-banner',
  imports: [RouterLink, TuiButton, TuiTitle, TuiCardLarge],
  templateUrl: './continue-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ContinueBannerComponent {
  protected readonly active = inject(SessionsService).active;

  constructor() {
    this.active.reload();
  }
}
