import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';

@Component({
  selector: 'app-continue-banner',
  imports: [RouterLink, TuiButton, TuiTitle, TuiCardLarge],
  templateUrl: './continue-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ContinueBannerComponent {
  readonly workoutName = input.required<string>();
}
