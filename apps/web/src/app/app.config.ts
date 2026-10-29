import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { appRoutes } from './app.routes';
import { deviceIdInterceptor } from './device-id';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideTaiga(),
    provideEventPlugins(),
    provideHttpClient(withInterceptors([deviceIdInterceptor])),
    provideRouter(appRoutes),
  ],
};
