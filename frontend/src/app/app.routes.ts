import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { authGuard } from './core/guard/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
    ],
  },
  {
    path: 'perfume',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/inventory/inventory').then((m) => m.Inventory),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/perfume-detail/perfume-detail').then((m) => m.PerfumeDetail),
      },
    ],
  },
  {
    path: 'recommend',
    canActivate: [authGuard],

    loadComponent: () =>
      import('./features/recommendation/recommendation').then((m) => m.Recommendation),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
