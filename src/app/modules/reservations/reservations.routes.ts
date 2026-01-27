// src/app/modules/reservations/reservations.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { adminOnlyGuard, clientOnlyGuard } from '../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard], // usuario logueado
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'browse' },

      // Cliente: explorar clases (solo CLIENT)
      {
        path: 'browse',
        canActivate: [clientOnlyGuard],
        loadComponent: () =>
          import('./pages/browse/browse.page').then((m) => m.BrowsePage),
      },

      // Admin: browse de admin (solo ADMIN)
      {
        path: 'admin-browse',
        canActivate: [adminOnlyGuard],
        loadComponent: () =>
          import('./pages/admin-browse/admin-browse.page').then(
            (m) => m.AdminBrowsePage
          ),
      },

      // Cliente: mis reservas (solo CLIENT)
      {
        path: 'mine',
        canActivate: [clientOnlyGuard],
        loadComponent: () =>
          import('./pages/mine/mine.page').then((m) => m.MinePage),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/reservations-history/reservations-history.page')
            .then(m => m.ReservationsHistoryPage)
      }

    ],
  },
];

export default routes;
