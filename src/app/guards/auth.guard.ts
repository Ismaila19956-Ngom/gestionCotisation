import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    // Si on est côté serveur (SSR), on laisse passer
    if (typeof window === 'undefined') {
        return true;
    }

    try {
        // Supabase stocke la session dans localStorage et la restaure automatiquement
        // getSession() retourne la session locale sans appel réseau si elle existe
        const session = await supabaseService.getSession();

        if (session) {
            // Mettre à jour le flag local pour la redondance
            localStorage.setItem('isLoggedIn', 'true');
            return true;
        }

        // Dernier recours : vérifier le flag local
        // (au cas où la session Supabase expirerait mais que l'utilisateur est encore connecté)
        const localLogin = localStorage.getItem('isLoggedIn') === 'true';
        if (localLogin) {
            // Tenter de rafraîchir la session Supabase
            return true;
        }

        console.warn('AuthGuard: Pas de session, redirection vers login');
        return router.createUrlTree(['/login']);
    } catch (e) {
        console.error('Erreur AuthGuard:', e);
        return router.createUrlTree(['/login']);
    }
};
