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

      // 👇 Reservations: SOLO autenticado (los roles se validan en las rutas hijas)
      {
        path: 'reservations',
        canActivate: [authGuard], // ⬅️ quitado roleGuard([CLIENT])
        loadChildren: () =>
          import('./modules/reservations/reservations.routes').then(
            (m) => m.default
          ),
      },

      // 👇 Admin: SOLO admin (esto es correcto)
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
      {
        path: 'notifications',
        canActivate: [authGuard, roleGuard([RoleEnum.ADMIN])],
        loadComponent: () =>
          import('./modules/notifications/notifications.component').then(
            (m) => m.NotificationsComponent
          ),
      },

      // Chatbot (ajusta si debe ser público)
      {
        path: 'chatbot',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./modules/chatbot/chatbot.page').then((m) => m.ChatbotPage),
      },

      // redirección por defecto dentro del layout
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },

  // wildcard ABSOLUTO
  { path: '**', redirectTo: '/home' },
];
