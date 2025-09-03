import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiRoot, TuiButton } from '@taiga-ui/core';

import { TelegramService, ThemeService } from '@/shared';
import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, TuiButton, RouterLink, RouterLinkActive],
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
