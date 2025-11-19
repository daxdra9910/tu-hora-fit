import { Routes } from '@angular/router';
import { PlansPage } from './pages/plans/plans.page';
import { PaymentPage } from './pages/payment/payment.page';
import { PaymentSuccessPage } from './pages/payment-success/payment-success.page'; // ← NUEVA IMPORTACIÓN

export const routes: Routes = [
  {
    path: '',
    component: PlansPage
  },
  {
    path: 'payment/:id',
    component: PaymentPage
  },
  {
    path: 'success', // ← NUEVA RUTA
    component: PaymentSuccessPage
  }
];
