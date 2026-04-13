import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./views/auth/login.component')
                .then(m => m.LoginComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./views/dashboard/dashboard.component')
                        .then(m => m.DashboardComponent)
            },
            {
                path: 'membres',
                loadComponent: () =>
                    import('./views/membres/member-list.component')
                        .then(m => m.MemberListComponent)
            },
            {
                path: 'membres/:id',
                loadComponent: () =>
                    import('./views/membres/member-detail.component')
                        .then(m => m.MemberDetailComponent)
            },
            {
                path: 'membres/suivi/:id',
                loadComponent: () =>
                    import('./views/membres/member-suivi.component')
                        .then(m => m.MemberSuiviComponent)
            },
            {
                path: 'comptabilite',
                loadComponent: () =>
                    import('./views/finance/finance.component')
                        .then(m => m.FinanceComponent)
            },
            {
                path: 'parametres',
                loadComponent: () =>
                    import('./views/parametres/parametres.component')
                        .then(m => m.ParametresComponent)
            },
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
