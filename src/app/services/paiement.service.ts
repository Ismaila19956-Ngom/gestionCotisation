import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Initie une session de paiement via une Supabase Edge Function
   * @param montant Montant de la cotisation
   * @param mois Mois concerné
   * @param methode Mode de paiement (WAVE ou OM)
   * @returns L'URL de paiement (Sandbox)
   */
  async initierPaiement(montant: number, mois: string, methode: string): Promise<string> {
    const { data, error } = await this.supabaseService.client.functions.invoke('pay-request', {
      body: { 
        montant, 
        mois, 
        telephone: '773657231', // Numéro de test imposé
        type: methode
      }
    });

    if (error) {
      console.error('Erreur lors de l\'appel à la Edge Function:', error);
      throw error;
    }

    return data.payment_url;
  }
}
