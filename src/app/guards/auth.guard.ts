import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    try {
        const session = await supabaseService.getSession();
        
        // Fallback sécurisé pour le SSR (Server-Side Rendering)
        let localLogin = false;
        if (typeof window !== 'undefined' && window.localStorage) {
            localLogin = localStorage.getItem('isLoggedIn') === 'true';
        }

        if (session || localLogin) {
            return true;
        } else {
            console.warn('AuthGuard: Session introuvable, redirection...');
            router.navigate(['/login']);
            return false;
        }
    } catch (e) {
        console.error('Erreur AuthGuard:', e);
        // Si c'est une erreur liée au SSR (localStorage undefined), on laisse passer pour que le client reprenne la main
        if (typeof window === 'undefined') {
            return true; 
        }
        router.navigate(['/login']);
        return false;
    }
};
