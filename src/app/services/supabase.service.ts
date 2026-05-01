import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { membresCampagneData } from '../models/membres_asc.data';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    public supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    get client() { return this.supabase; }

    // --- Auth ---
    async getSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        return session;
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async signOut() { await this.supabase.auth.signOut(); }

    // --- Campagnes ---
    async getCampagnes() {
        const { data } = await this.supabase.from('campagnes').select('*').order('annee', { ascending: false });
        return data || [];
    }

    async getActiveCampagne() {
        const { data } = await this.supabase.from('campagnes').select('*').eq('statut', 'EN_COURS').limit(1).maybeSingle();
        return data;
    }

    async saveCampagne(campagne: any) {
        const { data, error } = await this.supabase.from('campagnes').upsert(campagne).select();
        if (error) throw error;
        return data[0];
    }

    async deleteCampagne(id: number) {
        await this.supabase.from('campagnes').delete().eq('id', id);
    }

    // --- Configuration des Catégories ---
    async getCategories() {
        try {
            const { data, error } = await this.supabase.from('config_categories').select('*').order('montant', { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn('Using local fallback for categories');
            const local = localStorage.getItem('asc_categories');
            return local ? JSON.parse(local) : [
                { id: 1, montant: 1000, actif: true },
                { id: 2, montant: 2000, actif: true },
                { id: 3, montant: 3000, actif: true },
                { id: 4, montant: 5000, actif: true },
                { id: 10, montant: 10000, actif: true }
            ];
        }
    }

    async saveCategory(category: any) {
        try {
            const { data, error } = await this.supabase.from('config_categories').upsert(category).select();
            if (error) throw error;
            return data[0];
        } catch (e) {
            // Fallback localStorage
            const categories = await this.getCategories();
            if (!category.id) category.id = Date.now();
            
            const index = categories.findIndex((c: any) => c.id === category.id || c.montant === category.montant);
            if (index >= 0) categories[index] = category;
            else categories.push(category);
            
            localStorage.setItem('asc_categories', JSON.stringify(categories));
            return category;
        }
    }

    async deleteCategory(id: number) {
        try {
            const { error } = await this.supabase.from('config_categories').delete().eq('id', id);
            if (error) throw error;
        } catch (e) {
            const categories = await this.getCategories();
            const filtered = categories.filter((c: any) => c.id !== id);
            localStorage.setItem('asc_categories', JSON.stringify(filtered));
        }
    }

    // --- Membres ---
    async getMembers() {
        const campagne = await this.getActiveCampagne();
        if (!campagne) return [];
        return this.getMembersByCampagne(campagne.id);
    }

    async getMembersByCampagne(campagneId: number) {
        const { data } = await this.supabase.from('membres').select('*').eq('campagne_id', campagneId).limit(5000);
        return data || [];
    }

    async getAllGlobalMembers() {
        try {
            const { data, error } = await this.supabase
                .from('membres')
                .select('prenom, nom, sexe, telephone')
                .limit(500); // Limite raisonnable pour la rapidité

            if (error) throw error;
            
            const unique = [];
            const seen = new Set();
            if (data) {
                for (const m of data) {
                    const key = `${m.prenom?.toLowerCase()}|${m.nom?.toLowerCase()}`;
                    if (!seen.has(key)) {
                        unique.push(m);
                        seen.add(key);
                    }
                }
            }
            return unique;
        } catch (e) {
            console.error('Failed to fetch global members:', e);
            return [];
        }
    }

    async getMembresByCategorie(campagneId: number, categorieMontant: number, page: number, pageSize: number) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // FILTRAGE ULTRA-STRICT : categorie_id DOIT ÊTRE LE MONTANT REEL
        console.log(`Supabase Query: categorie_id = ${categorieMontant}`);
        const { data, error, count } = await this.supabase
            .from('membres')
            .select('*', { count: 'exact' })
            .eq('campagne_id', campagneId)
            .eq('categorie_id', Number(categorieMontant))
            .order('nom', { ascending: true })
            .range(from, to);

        if (error) throw error;
        return { data, count };
    }

    async addMember(member: any) {
        const { data, error } = await this.supabase.from('membres').insert([member]).select();
        if (error) throw error;
        return data[0];
    }

    async initializeMemberCotisations(memberId: number, campagneId: number, montant: number = 0) {
        const months = [
            'Octobre', 'Novembre', 'Décembre',
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre'
        ];

        const cotisations = months.map(mois => ({
            membre_id: memberId,
            campagne_id: campagneId,
            mois: mois,
            montant: montant,
            avance: 0,
            reste: montant,
            statut: 'En retard'
        }));

        const { error } = await this.supabase.from('cotisations').insert(cotisations);
        if (error) throw error;
    }

    async updateMember(id: number, updates: any) {
        const { data, error } = await this.supabase.from('membres').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    }

    async deleteMember(id: number) {
        // Supprimer d'abord les cotisations liées pour l'intégrité référentielle
        await this.supabase.from('cotisations').delete().eq('membre_id', id);
        // Puis supprimer le membre
        const { error } = await this.supabase.from('membres').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Cotisations ---
    async getCotisations() {
        const campagne = await this.getActiveCampagne();
        if (!campagne) return [];
        return this.getCotisationsByCampagne(campagne.id);
    }

    async getCotisationsByCampagne(campagneId: number) {
        const { data } = await this.supabase.from('cotisations').select('*').eq('campagne_id', campagneId).limit(5000);
        return data || [];
    }

    async getCotisationsByMembre(membreId: number) {
        const campagne = await this.getActiveCampagne();
        if (!campagne) return [];
        const { data } = await this.supabase.from('cotisations').select('*').eq('membre_id', membreId).eq('campagne_id', campagne.id);
        return data || [];
    }

    async saveCotisation(cotisation: any) {
        const { data, error } = await this.supabase.from('cotisations').upsert(cotisation).select();
        if (error) throw error;
        return data[0];
    }

    async updateCotisation(id: string, updates: any) {
        const { data, error } = await this.supabase.from('cotisations').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    }

    async addCotisation(cotisation: any) {
        return this.saveCotisation(cotisation);
    }

    // --- Sync & Realtime ---
    subscribeToChanges(table: string, callback: (payload: any) => void) {
        return this.supabase
            .channel(`realtime-${table}-${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => callback(payload))
            .subscribe();
    }

    async initialSyncToSupabase() {
        try {
            console.log('--- RÉINITIALISATION RADICALE (AUCUN MAPPING) ---');

            // 1. Vidage total
            await this.supabase.from('cotisations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('membres').delete().neq('id', 0);
            await this.supabase.from('campagnes').delete().neq('id', 0);

            // 2. Création de la campagne
            const { data: campData } = await this.supabase.from('campagnes').insert([{ libelle: 'Saison 2025/2026', annee: '2025/2026', statut: 'EN_COURS' }]).select();
            const campagneId = campData![0].id;
            const months = ["Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre"];

            // 3. Migration Membre par Membre avec MONTANT REEL
            // 3. Migration Membre par Membre avec MONTANT REEL
            console.log("Début de l'insertion des membres et cotisations...");
            
            for (const m of membresCampagneData) {
                const parts = m.nom ? m.nom.trim().split(' ') : [''];
                const nom = parts.length > 1 ? parts.pop() : m.nom;
                const prenom = parts.length > 0 ? parts.join(' ') : '';
                const montantReel = Number(m.categorie);

                // Insertion du membre
                const { data: memRes, error: memErr } = await this.supabase
                    .from('membres')
                    .insert([{
                        campagne_id: campagneId,
                        categorie_id: montantReel,
                        prenom, nom, sexe: m.sexe === 'Femme' ? 'F' : 'H'
                    }])
                    .select().single();

                if (memErr) {
                    console.error(`Erreur pour ${prenom} ${nom}:`, memErr);
                    continue;
                }

                if (memRes) {
                    const cotisBatch = [];
                    const jsonP = (m as any).paiements || [];
                    for (const mois of months) {
                        const p = jsonP.find((x: any) => x.mois === mois);
                        cotisBatch.push({
                            membre_id: memRes.id,
                            campagne_id: campagneId,
                            mois,
                            montant: montantReel,
                            avance: Math.round(Number(p?.avance || 0)),
                            reste: Math.round(Number(p?.reste || 0)),
                            statut: p?.statut || 'En retard'
                        });
                    }
                    // Insertion groupée des 12 mois pour ce membre
                    const { error: cotErr } = await this.supabase.from('cotisations').insert(cotisBatch);
                    if (cotErr) console.error(`Erreur cotisations pour ${prenom} ${nom}:`, cotErr);
                }
            }
            console.log('MIGRATION TERMINÉE AVEC SUCCÈS.');
        } catch (e) {
            console.error('FATAL SYNC ERROR:', e);
            throw e;
        }
    }
}
