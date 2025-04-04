import { Routes } from "@angular/router";

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
    }
]

export default routes;