import { Injectable, signal, computed, inject } from '@angular/core';
import { Member, Cotisation, StatutCotisation } from '../models/cotisation.model';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class MemberService {
    private supabase = inject(SupabaseService);

    private members = signal<Member[]>([]);
    private cotisations = signal<Cotisation[]>([]);

    constructor() {
        this.init();
    }

    private async init() {
        try {
            await this.refreshFromSupabase();

            // Subscribe to real-time changes
            this.supabase.subscribeToChanges('membres', () => this.refreshFromSupabase());
            this.supabase.subscribeToChanges('cotisations', () => this.refreshFromSupabase());
        } catch (err) {
            console.error('Supabase error:', err);
        }
    }

    // Map DB statuts to model statuts
    private readonly STATUT_MAP: { [key: string]: StatutCotisation } = {
        'Payé': 'À jour',
        'En cours': 'À jour',
        'En retard': 'Rappel',
        'Partiel': 'Rappel',
        'Avance': 'Avance'
    };

    private async refreshFromSupabase() {
        try {
            const membersData = await this.supabase.getMembers();
            const cotisationsData = await this.supabase.getCotisations();

            const transformedMembers = membersData.map((m: any) => ({
                id: m.id,
                prenom: m.prenom || '',
                nom: m.nom || '',
                categorie_id: Number(m.categorie_id) || 5000,
                sexe: m.sexe === 'H' ? 'M' : (m.sexe || 'M'),
                dateNaissance: m.date_naissance || '',
                dateAdhesion: m.date_adhesion || ''
            })) as Member[];

            const transformedCotis = cotisationsData.map((c: any) => ({
                id: c.id,
                membreId: c.membre_id,
                reference: c.reference || `COT-${c.id}`,
                mois: c.mois,
                annee: c.annee || 2025,
                // avance = montant réellement versé ce mois
                montantVerse: Number(c.avance) || 0,
                datePaiement: c.updated_at || c.date_paiement || '',
                status: this.STATUT_MAP[c.statut] || 'À jour',
                observation: c.observation || ''
            })) as unknown as Cotisation[];

            this.members.set(transformedMembers);
            this.cotisations.set(transformedCotis);
        } catch (err) {
            console.error('Error refreshing from Supabase:', err);
        }
    }

    getMembers() {
        return this.members.asReadonly();
    }

    getMemberById(id: any) {
        return this.members().find(m => m.id == id);
    }

    getMemberHistory(memberId: any) {
        return computed(() =>
            this.cotisations().filter(c => c.membreId == memberId)
                .sort((a: any, b: any) => {
                    if (typeof a.id === 'number' && typeof b.id === 'number') return b.id - a.id;
                    return String(b.id).localeCompare(String(a.id));
                })
        );
    }

    getContributionByMemberId(id: any) {
        return this.getMemberHistory(id);
    }

    getAllCotisations() {
        return this.cotisations.asReadonly();
    }

    async addMember(m: Omit<Member, 'id'>) {
        try {
            const campagne = await this.supabase.getActiveCampagne();
            if (!campagne) throw new Error('Aucune campagne active trouvée');

            const newMember = await this.supabase.addMember({
                prenom: m.prenom,
                nom: m.nom,
                sexe: m.sexe === 'M' ? 'H' : (m.sexe || 'F'),
                categorie_id: Number(m.categorie_id),
                campagne_id: campagne.id
            });

            if (newMember && newMember.id) {
                // Initialiser les 12 mois de cotisations pour ce membre
                await this.supabase.initializeMemberCotisations(newMember.id, campagne.id);
            }

            await this.refreshFromSupabase();
            return true;
        } catch (err) {
            console.error('Failed to save member to Supabase:', err);
            throw err;
        }
    }

    async updateMember(m: Member) {
        try {
            await this.supabase.updateMember(m.id, {
                prenom: m.prenom,
                nom: m.nom,
                sexe: m.sexe === 'M' ? 'H' : (m.sexe || 'F'),
                categorie_id: Number(m.categorie_id)
            });
            await this.refreshFromSupabase();
            return true;
        } catch (err) {
            console.error('Failed to update member in Supabase:', err);
            throw err;
        }
    }

    async deleteMember(id: number) {
        try {
            await this.supabase.deleteMember(id);
            await this.refreshFromSupabase();
        } catch (err) {
            console.error('Failed to delete member in Supabase:', err);
        }
    }

    async addContribution(c: Omit<Cotisation, 'id' | 'status' | 'reference'>) {
        const member = this.getMemberById(c.membreId);
        const monthlyAmount = member ? Number(member.categorie_id) : 0;

        let status: StatutCotisation = 'À jour';
        if (c.montantVerse > monthlyAmount) status = 'Avance';
        else if (c.montantVerse < monthlyAmount) status = 'Rappel';

        const currentCotis = this.cotisations();
        let nextId: any;
        if (currentCotis.length > 0 && typeof currentCotis[0].id === 'number') {
            nextId = Math.max(0, ...currentCotis.map(p => Number(p.id))) + 1;
        } else {
            nextId = Date.now(); // Fallback for non-numeric IDs or empty list
        }
        const ref = `COT-${c.annee}-${nextId.toString().slice(-4).padStart(4, '0')}`;

        try {
            await this.supabase.addCotisation({
                membre_id: c.membreId,
                reference: ref,
                mois: c.mois,
                annee: c.annee,
                montant_verse: c.montantVerse,
                date_paiement: c.datePaiement,
                status: status
            });
            await this.refreshFromSupabase();
        } catch (err) {
            console.error('Failed to add contribution to Supabase:', err);
        }
    }

    formatMontant(v: number): string {
        return new Intl.NumberFormat('fr-FR').format(v) + ' F';
    }

    calculateAge(dateOfBirth: string): number {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}
