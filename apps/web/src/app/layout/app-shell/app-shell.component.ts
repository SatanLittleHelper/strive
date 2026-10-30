import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TuiLink } from '@taiga-ui/core';
import { BottomNavComponent } from '../bottom-nav';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet, BottomNavComponent, TuiLink],
  templateUrl: './app-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col' },
})
export class AppShellComponent {}
