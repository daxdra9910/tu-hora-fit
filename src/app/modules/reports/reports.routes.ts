import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/inventory/inventory.page').then((m) => m.InventoryPage)
  }
] as Routes;
