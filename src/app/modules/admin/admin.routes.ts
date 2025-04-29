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
    path: 'inventario',
    loadComponent: () => import('./pages/inventory/inventory.page').then(m => m.InventoryPage)
  }
];

export default routes;
