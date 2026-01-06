import { Routes } from "@angular/router";
import { roleGuard } from "../core/guards/role.guard";
import { RoleEnum } from "../shared/enums/role.enum";

const routes: Routes = [
  // 🧑‍💼 Admin home (only for ADMIN role) - Ruta: /home
  {
    path: '',
    canActivate: [roleGuard([RoleEnum.ADMIN])],
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },

  // 🙋‍♀️ Client home (only for CLIENT role) - Ruta: /home/client
  {
    path: 'client',
    canActivate: [roleGuard([RoleEnum.CLIENT])],
    loadComponent: () =>
      import('./pages/home-client/home.page').then((m) => m.HomeClientPage),
  },

  // Redirección por defecto (opcional)
  {
    path: '**',
    redirectTo: ''
  }
];

export default routes;
