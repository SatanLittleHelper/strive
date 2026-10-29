import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { NAV_ITEMS } from './nav-links.constants';

@Component({
  selector: 'app-nav-links',
  imports: [RouterLink, RouterLinkActive, TuiButton],
  templateUrl: './nav-links.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-center gap-2' },
})
export class NavLinksComponent {
  protected readonly items = NAV_ITEMS;
}
