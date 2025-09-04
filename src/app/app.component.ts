import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

import { TelegramService, NavigationComponent } from '@/shared';
import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly telegramService = inject(TelegramService);

  ngOnInit(): void {
    this.telegramService.webApp.ready();
  }
}
