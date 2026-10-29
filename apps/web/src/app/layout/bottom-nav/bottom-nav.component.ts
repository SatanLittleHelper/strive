import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS } from './bottom-nav.constants';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block border-b border-border bg-surface max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-10 max-md:border-b-0 max-md:border-t',
  },
})
export class BottomNavComponent {
  protected readonly items = NAV_ITEMS;
}
