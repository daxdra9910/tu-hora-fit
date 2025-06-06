import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: 'customers',
    loadComponent: () => import('./pages/customer/customer.page').then((m) => m.CustomerPage),
  },
  {
    path: 'plans',
    loadComponent: () => import('./pages/plans/plans.page').then(m => m.PlansPage)
  },
  {
    path: 'inventory',
    loadComponent: () => import('./pages/inventory/inventory.page').then(m => m.InventoryPage)
  },
  {
    path: 'class-page',
    loadComponent: () => import('./pages/class-page/class-page.page').then(m => m.ClassPage) // ✅ Aquí el cambio
  }
];

export default routes;
