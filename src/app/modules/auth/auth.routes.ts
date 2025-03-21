import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/background-layout/background-layout.component').then((m) => m.BackgroundLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage)
      },
    ]
  },
]

export default routes;