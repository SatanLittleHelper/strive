import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot, TuiButton } from '@taiga-ui/core';

import { TelegramService } from '@/shared/services/telegram';
import { ThemeService } from '@/shared/services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, TuiButton],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly telegramService = inject(TelegramService);
  private readonly themeService = inject(ThemeService);

  constructor() {
    this.telegramService.webApp.ready();
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  public isDark(): boolean {
    return this.themeService.isDark();
  }
}
