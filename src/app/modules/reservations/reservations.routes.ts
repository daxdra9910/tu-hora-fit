import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'browse' },
      {
        path: 'browse',
        loadComponent: () =>
          import('./pages/browse/browse.page').then((m) => m.BrowsePage),
      },

    ],
  },
];

export default routes;
