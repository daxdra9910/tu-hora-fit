import { Routes } from '@angular/router';
import { antiAuthGuard, authGuard } from './modules/core/guards/auth.guard';
import { roleGuard } from './modules/core/guards/role.guard';
import { RoleEnum } from './modules/shared/enums/role.enum';
import { PaymentsHistoryPage } from './modules/plans/pages/payments-history/payments-history.page';


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

      {
        path: 'reservations',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./modules/reservations/reservations.routes').then(
            (m) => m.default
          ),
      },

      // 👉 NUEVA RUTA: Planes para clientes
      {
        path: 'plans',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./modules/plans/plans.routes').then((m) => m.routes),
      },

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
        canActivate: [authGuard],
        loadChildren: () =>
          import('./modules/notifications/notifications.routes').then(
            (m) => m.default
          ),
      },
      {
        path: 'chatbot',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./modules/chatbot/chatbot.page').then((m) => m.ChatbotPage),
      },
      // NUEVA RUTA DEL PERFIL
      {
        path: 'profile',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./modules/profile/profile.routes').then((m) => m.profileRoutes),
      },
      {
        path: 'payments-history',
        component: PaymentsHistoryPage
      },


      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },

  { path: '**', redirectTo: '/home' },
];
