import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { membresCampagneData } from '../models/membres_asc.data';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        // Configuration Supabase depuis l'environnement
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    get client() {
        return this.supabase;
    }

    // --- Campagnes ---
    async getCampagnes() {
        const { data, error } = await this.supabase
            .from('campagnes')
            .select('*')
            .order('annee', { ascending: false });
        if (error) throw error;
        return data;
    }

    async saveCampagne(campagne: any) {
        const { data, error } = await this.supabase
            .from('campagnes')
            .upsert(campagne)
            .select();
        if (error) throw error;
        return data[0];
    }

    async deleteCampagne(id: number) {
        const { error } = await this.supabase
            .from('campagnes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    // --- Membres ---
    async getMembresPagine(campagneId: number, page: number, pageSize: number) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.supabase
            .from('membres')
            .select('*', { count: 'exact' })
            .eq('campagne_id', campagneId)
            .order('nom', { ascending: true })
            .range(from, to);

        if (error) throw error;
        return { data, count };
    }

    async getMembresByCategorie(campagneId: number, categorieMontant: number, page: number, pageSize: number) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.supabase
            .from('membres')
            .select('*', { count: 'exact' })
            .eq('campagne_id', campagneId)
            .eq('categorie_id', this.getCategorieIdFromMontant(categorieMontant))
            .order('nom', { ascending: true })
            .range(from, to);

        if (error) throw error;
        return { data, count };
    }

    // Helper pour mapper le montant à l'ID de catégorie (Toujours des Nombres)
    private getCategorieIdFromMontant(montant: any): number {
        const val = Number(montant);
        const mapping: { [key: number]: number } = { 1000: 1, 2000: 2, 3000: 3, 5000: 4, 10000: 5 };
        return mapping[val] || 1;
    }

    // --- Cotisations ---
    async getCotisationsByMembre(membreId: number) {
        const { data, error } = await this.supabase
            .from('cotisations')
            .select('*')
            .eq('membre_id', membreId)
            .order('mois', { ascending: true });
        if (error) throw error;
        return data;
    }

    async saveCotisation(cotisation: any) {
        const { data, error } = await this.supabase
            .from('cotisations')
            .upsert(cotisation)
            .select();
        if (error) throw error;
        return data[0];
    }

    async updateCotisation(id: string, updates: any) {
        const { data, error } = await this.supabase
            .from('cotisations')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    }

    // --- Migration & Sync ---
    async initialSyncToSupabase() {
        console.log('Démarrage de la synchronisation initiale robuste vers Supabase...');

        try {
            // 1. Initialisation Campagne (Octobre à Septembre)
            const newCampagne = {
                id: 1,
                annee: 2025,
                libelle: 'Saison 2025/2026',
                mois_debut: 10,
                mois_fin: 9,
                statut: 'EN_COURS'
            };
            
            // On utilise upsert pour s'assurer que la campagne ID=1 existe
            const { data: savedCamp, error: campErr } = await this.supabase.from('campagnes').upsert(newCampagne).select();
            if (campErr) {
                console.error('Erreur lors de la création de la campagne:', campErr);
                return;
            }
            
            const campagneId = savedCamp[0].id;
            console.log('Campagne validée, ID:', campagneId);

            // NETTOYAGE : Pour une "Migration Complète", on vide les anciennes données de cette campagne
            console.log('Nettoyage des anciennes données...');
            await this.supabase.from('cotisations').delete().eq('campagne_id', campagneId);
            await this.supabase.from('membres').delete().eq('campagne_id', campagneId);

            // Liste complète des mois de la campagne
            const monthsRange = ["Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre"];

            console.log(`Insertion de ${membresCampagneData.length} membres...`);

            // 2. Insérer les membres et leurs cotisations
            for (const m of membresCampagneData) {
                const nameParts = m.nom ? m.nom.split(' ') : [''];
                const nom = nameParts.length > 1 ? nameParts.pop() : m.nom;
                const prenom = nameParts.length > 0 ? nameParts.join(' ') : '';

                const membreData = {
                    id: m.id,
                    campagne_id: campagneId,
                    categorie_id: this.getCategorieIdFromMontant(m.categorie),
                    prenom: prenom,
                    nom: nom,
                    sexe: this.detectGender(prenom)
                };

                const { error: mErr } = await this.supabase.from('membres').insert(membreData);
                if (mErr) {
                    console.error(`Erreur insertion membre ${m.nom}:`, mErr);
                    continue; // On continue avec le suivant si un membre échoue
                }
                
                // Générer les cotisations pour tous les mois de la campagne
                const jsonPaiements = (m as any).paiements || [];
                const cotisations = monthsRange.map(nomMois => {
                    const existing = jsonPaiements.find((p: any) => p.mois === nomMois);
                    return {
                        membre_id: Number(m.id),
                        campagne_id: Number(campagneId),
                        mois: nomMois,
                        montant: Number(m.categorie),
                        statut: existing ? existing.statut : this.calculateInitialStatut(nomMois),
                        avance: existing ? Number(existing.avance || 0) : 0,
                        reste: existing ? Number(existing.reste || 0) : Number(m.categorie),
                        observation: existing ? existing.observation || '' : ''
                    };
                });

                const { error: cErr } = await this.supabase.from('cotisations').insert(cotisations);
                if (cErr) console.error(`Erreur insertion cotisations pour ${m.nom}:`, cErr);
            }

            console.log('Synchronisation initiale terminée avec succès !');
        } catch (err) {
            console.error('Erreur globale lors de la synchronisation:', err);
        }
    }

    private detectGender(prenom: string): string {
        const p = prenom.toLowerCase();
        const maleNames = ['massamba', 'papa', 'pierre', 'ismaila', 'abdou', 'moussa', 'aliou', 'cheikh', 'amadou'];
        const femaleNames = ['adja', 'fatou', 'aminata', 'mariama', 'khadija', 'binta', 'awa', 'coumba', 'ramatoulaye'];

        if (maleNames.some(name => p.includes(name))) return 'H';
        if (femaleNames.some(name => p.includes(name))) return 'F';
        
        return 'H'; // Par défaut
    }

    private calculateInitialStatut(nomMois: string): string {
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const moisIndex = monthNames.indexOf(nomMois) + 1;
        
        if (moisIndex > currentMonth) return 'En cours';
        if (moisIndex < currentMonth) return 'En retard';
        return currentDay >= 10 ? 'En retard' : 'En cours';
    }

    subscribeToChanges(table: string, callback: (payload: any) => void) {
        return this.supabase
            .channel(`${table}_changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
            .subscribe();
    }

    // --- Auth & Session ---
    async getSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        return session;
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    // --- Méthodes pour MemberService (Utilise uniquement la table 'membres') ---
    async getMembers() {
        const { data, error } = await this.supabase.from('membres').select('*');
        if (error) throw error;
        return data;
    }

    async getCotisations() {
        const { data, error } = await this.supabase.from('cotisations').select('*');
        if (error) throw error;
        return data;
    }

    async addMember(member: any) {
        const { data, error } = await this.supabase.from('membres').insert([member]).select();
        if (error) throw error;
        return data[0];
    }

    async updateMember(id: number, updates: any) {
        const { data, error } = await this.supabase.from('membres').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    }

    async addCotisation(cotisation: any) {
        return this.saveCotisation(cotisation);
    }
}

