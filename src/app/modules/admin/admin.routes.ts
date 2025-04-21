import {Routes} from "@angular/router";

const routes: Routes = [
  {
    path: 'customers',
    loadComponent: () => import('./pages/customer/customer.page').then((m) => m.CustomerPage),
  },  {
    path: 'plans',
    loadComponent: () => import('./pages/plans/plans.page').then( m => m.PlansPage)
  }

]

export default routes;
