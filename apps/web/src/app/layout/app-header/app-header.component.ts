import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavLinksComponent } from '../nav-links';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NavLinksComponent],
  templateUrl: './app-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-b border-gray-200' },
})
export class AppHeaderComponent {}
