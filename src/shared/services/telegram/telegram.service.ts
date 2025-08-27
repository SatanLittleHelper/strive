import { Injectable } from '@angular/core';

import type { WebApp } from 'telegram-web-app';

@Injectable({
  providedIn: 'root',
})
export class TelegramService {
  private readonly tg: WebApp = window.Telegram.WebApp;

  get webApp(): WebApp {
    return this.tg;
  }
}
