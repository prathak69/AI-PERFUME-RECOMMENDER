import { Routes } from '@angular/router';
import { Home } from './features/home/home';

export const routes: Routes = [
    {
        path: '',
        component: Home,
        pathMatch: 'full'
    },
    {
        path: 'perfume',
        children: [
            {
                path: '',
                loadComponent: () => import('./features/inventory/inventory').then(m => m.Inventory)
            },
            {
                path: ':id',
                loadComponent: () => import('./features/perfume-detail/perfume-detail').then(m => m.PerfumeDetail)
            }
        ]
    },
    {
        path: 'recommend',
        loadComponent: () => import('./features/recommendation/recommendation').then(m => m.Recommendation)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
