import { Routes } from "@angular/router";

const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
    }
]

export default routes;