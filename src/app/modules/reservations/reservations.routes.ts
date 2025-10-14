// src/app/modules/reservations/reservations.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'browse' },

      // 👉 Página de explorar clases (actual)
      {
        path: 'browse',
        loadComponent: () =>
          import('./pages/browse/browse.page').then((m) => m.BrowsePage),
      },

      // 👉 NUEVA página: Mis reservas (MinePage)
      {
        path: 'mine',
        loadComponent: () =>
          import('./pages/mine/mine.page').then((m) => m.MinePage),
      },
    ],
  },
];

export default routes;
