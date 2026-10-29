import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiRoot } from '@taiga-ui/core';
import { AppShellComponent } from './layout';

@Component({
  selector: 'app-root',
  imports: [TuiRoot, AppShellComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class App {}
