import { Routes } from "@angular/router";
import { roleGuard } from "../core/guards/role.guard";
import { RoleEnum } from "../shared/enums/role.enum";

const routes: Routes = [
  // 🧑‍💼 Admin home (only for ADMIN role)
  {
    path: '',
    canActivate: [roleGuard([RoleEnum.ADMIN])],
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },

  // 🙋‍♀️ Client home (only for CLIENT role)
  {
    path: 'client',
    canActivate: [roleGuard([RoleEnum.CLIENT])],
    loadComponent: () =>
      import('./pages/home-client/home.page').then((m) => m.HomeClientPage),
  },
];

export default routes;
