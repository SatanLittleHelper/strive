import { Injectable } from '@angular/core';
import {WebApp} from 'telegram-web-app';

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
  private readonly tg: WebApp;

  constructor() {
    this.tg = window.Telegram.WebApp;
  }

  get webApp() {
    return this.tg;
  }
}
