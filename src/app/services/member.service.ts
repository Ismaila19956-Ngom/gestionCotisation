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

    private async refreshFromSupabase() {
        try {
            const membersData = await this.supabase.getMembers();
            const cotisationsData = await this.supabase.getCotisations();

            const transformedMembers = membersData.map((m: any) => ({
                id: m.id,
                prenom: m.prenom,
                nom: m.nom,
                sexe: m.sexe,
                categorie: m.categorie,
                dateNaissance: m.date_naissance || m.dateNaissance,
                dateAdhesion: m.date_adhesion || m.dateAdhesion
            })) as Member[];

            const transformedCotis = cotisationsData.map((c: any) => ({
                ...c,
                membreId: c.membre_id
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

    getMemberById(id: number) {
        return this.members().find(m => m.id === id);
    }

    getMemberHistory(memberId: number) {
        return computed(() =>
            this.cotisations().filter(c => c.membreId === memberId)
                .sort((a, b) => b.id - a.id)
        );
    }

    getContributionByMemberId(id: number) {
        return this.getMemberHistory(id);
    }

    getAllCotisations() {
        return this.cotisations.asReadonly();
    }

    async addMember(m: Omit<Member, 'id'>) {
        try {
            await this.supabase.addMember({
                prenom: m.prenom,
                nom: m.nom,
                date_naissance: m.dateNaissance,
                sexe: m.sexe,
                categorie: m.categorie,
                date_adhesion: m.dateAdhesion
            });
            await this.refreshFromSupabase();
        } catch (err) {
            console.error('Failed to save member to Supabase:', err);
        }
    }

    async updateMember(m: Member) {
        try {
            await this.supabase.updateMember(m.id, {
                prenom: m.prenom,
                nom: m.nom,
                date_naissance: m.dateNaissance,
                sexe: m.sexe,
                categorie: m.categorie,
                date_adhesion: m.dateAdhesion
            });
            await this.refreshFromSupabase();
        } catch (err) {
            console.error('Failed to update member in Supabase:', err);
        }
    }

    async addContribution(c: Omit<Cotisation, 'id' | 'status' | 'reference'>) {
        const member = this.getMemberById(c.membreId);
        const monthlyAmount = member ? parseInt(member.categorie) : 0;

        let status: StatutCotisation = 'À jour';
        if (c.montantVerse > monthlyAmount) status = 'Avance';
        else if (c.montantVerse < monthlyAmount) status = 'Rappel';

        const nextId = Math.max(0, ...this.cotisations().map(p => p.id)) + 1;
        const ref = `COT-${c.annee}-${nextId.toString().padStart(3, '0')}`;

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
