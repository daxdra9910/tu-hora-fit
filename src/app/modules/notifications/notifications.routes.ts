// src/app/home/notifications/notifications.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'admin' },
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/admin-notifications/admin-notifications.component')
            .then(m => m.NotificationsComponent),
      },
      {
        path: 'mine',
        loadComponent: () =>
          import('./pages/my-notifications/my-notifications.component')
            .then(m => m.MyNotificationsComponent),
      },
    ],
  },
];

export default routes;
