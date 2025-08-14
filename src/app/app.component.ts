import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TelegramService } from '@/shared/services/telegram';
import { ThemeService } from '@/shared/services/theme';
import { ButtonComponent } from '@/shared/ui/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonComponent],
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
