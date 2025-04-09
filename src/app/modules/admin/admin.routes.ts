import {Routes} from "@angular/router";

const routes: Routes = [
  {
    path: 'customers',
    loadComponent: () => import('./pages/customer/customer.page').then((m) => m.CustomerPage),
  }
]

export default routes;
