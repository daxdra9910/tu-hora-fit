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
    path: 'classes',
    loadComponent: () => import('./pages/class-page/class-page.page').then(m => m.ClassPage)
  },

  {
    path: 'employees',
    loadComponent: () => import('./pages/employees/employees.page').then( m => m.EmployeesPage)
  },


];

export default routes;
