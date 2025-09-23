import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

import { TelegramService, ThemeService, SwUpdateService } from '@/shared';
import { NavigationComponent } from '@/widgets';
import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, TuiRoot],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly telegramService = inject(TelegramService);
  private readonly themeService = inject(ThemeService);
  private readonly swUpdateService = inject(SwUpdateService);

  ngOnInit(): void {
    this.telegramService.webApp.ready();
    this.themeService.initialize();
  }
}
