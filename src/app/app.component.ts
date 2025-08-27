import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot, TuiButton } from '@taiga-ui/core';

import { TelegramService } from '@/shared/services/telegram';
import { ThemeService } from '@/shared/services/theme';
import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, TuiButton],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly telegramService = inject(TelegramService);
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.telegramService.webApp.ready();
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  public isDark(): boolean {
    return this.themeService.isDark();
  }
}
