import {Routes} from '@angular/router';
import {antiAuthGuard, authGuard} from './modules/core/guards/auth.guard';
import {roleGuard} from "./modules/core/guards/role.guard";
import {RoleEnum} from "./modules/shared/enums/role.enum";

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [antiAuthGuard],
    loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.default),
  },
  {
    path: '',
    loadComponent: () => import('./modules/shared/layouts/tab/tab.component').then((m) => m.TabComponent),
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadChildren: () => import('./modules/home/home.routes').then((m) => m.default)
      },
      {
        path: 'admin',
        canActivate: [authGuard, roleGuard([RoleEnum.ADMIN])],
        loadChildren: () => import('./modules/admin/admin.routes').then((m) => m.default)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
