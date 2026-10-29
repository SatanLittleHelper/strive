import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';
import { AppHeaderComponent } from './layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, AppHeaderComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class App {}
