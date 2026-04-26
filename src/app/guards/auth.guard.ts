import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    try {
        const session = await supabaseService.getSession();
        if (session) {
            return true;
        } else {
            router.navigate(['/login']);
            return false;
        }
    } catch {
        router.navigate(['/login']);
        return false;
    }
};
