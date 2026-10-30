import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { unwrapResponseInterceptor } from './api';
import { appRoutes } from './app.routes';
import { deviceIdInterceptor } from './device-id';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideTaiga(),
    provideEventPlugins(),
    provideHttpClient(withInterceptors([deviceIdInterceptor, unwrapResponseInterceptor])),
    provideRouter(appRoutes, withComponentInputBinding()),
  ],
};
