import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TelegramService } from './app/services/telegram.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly telegramService = inject(TelegramService);

  constructor() {
    this.telegramService.webApp.ready();
    console.log(this.telegramService.webApp);
  }
}
