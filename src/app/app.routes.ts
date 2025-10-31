// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { antiAuthGuard, authGuard } from './modules/core/guards/auth.guard';
import { roleGuard } from './modules/core/guards/role.guard';
import { RoleEnum } from './modules/shared/enums/role.enum';

export const routes: Routes = [
  // Auth fuera del layout
  {
    path: 'auth',
    canActivate: [antiAuthGuard],
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.default),
  },

  // Layout principal con tabs
  {
    path: '',
    loadComponent: () =>
      import('./modules/shared/layouts/tab/tab.component').then(
        (m) => m.TabComponent
      ),
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./modules/home/home.routes').then((m) => m.default),
      },

      // Reservations (roles se validan dentro del feature)
      {
        path: 'reservations',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./modules/reservations/reservations.routes').then(
            (m) => m.default
          ),
      },

      // Admin (área completa solo admin)
      {
        path: 'admin',
        canActivate: [authGuard, roleGuard([RoleEnum.ADMIN])],
        loadChildren: () =>
          import('./modules/admin/admin.routes').then((m) => m.default),
      },
      {
        path: 'reports',
        canActivate: [authGuard, roleGuard([RoleEnum.ADMIN])],
        loadChildren: () =>
          import('./modules/reports/reports.routes').then((m) => m.default),
      },

      // ✅ NOTIFICATIONS como FEATURE (auth en base; admin se valida adentro)
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./modules/notifications/notifications.routes').then(
            (m) => m.default
          ),
      },

      // Chatbot
      {
        path: 'chatbot',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./modules/chatbot/chatbot.page').then((m) => m.ChatbotPage),
      },

      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },

  { path: '**', redirectTo: '/home' },
];
