import type { App } from 'vue';

import { buttonAuthDirective } from './button-auth';

export function setupDirectives(app: App) {
  app.directive('button-auth', buttonAuthDirective);
}
