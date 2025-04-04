import { Routes } from '@angular/router';
import { antiAuthGuard, authGuard } from './modules/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [antiAuthGuard],
    loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.default),
  },
  {
    path: '',
    loadComponent: () => import('./modules/core/layouts/tab/tab.component').then(m => m.TabComponent),
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadChildren: () => import('./modules/home/home.routes').then( m => m.default)
      },
    ]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
