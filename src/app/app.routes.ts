import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./views/portail/portail.component')
                .then(m => m.PortailComponent),
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./views/auth/login.component')
                .then(m => m.LoginComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'membres',
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
                path: 'cotisations',
                loadComponent: () =>
                    import('./views/cotisations/cotisation-campaign-list.component')
                        .then(m => m.CotisationCampaignListComponent)
            },
            {
                path: 'cotisations/:id',
                loadComponent: () =>
                    import('./views/cotisations/cotisation-campaign-suivi.component')
                        .then(m => m.CotisationCampaignSuiviComponent)
            },
            {
                path: 'parametres',
                loadComponent: () =>
                    import('./views/parametres/parametres.component')
                        .then(m => m.ParametresComponent)
            },
            {
                path: 'galerie',
                loadComponent: () =>
                    import('./views/galerie/galerie.component')
                        .then(m => m.GalerieComponent)
            },
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
