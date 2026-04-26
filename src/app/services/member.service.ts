import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Member, Cotisation, CategorieCotisation, StatutCotisation } from '../models/cotisation.model';
import { LocalStorageService } from './local-storage.service';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class MemberService {
    private storage = inject(LocalStorageService);
    private supabase = inject(SupabaseService);

    private members = signal<Member[]>([]);
    private cotisations = signal<Cotisation[]>([]);

    private readonly MEMBERS_KEY = 'natangue_members';
    private readonly COTISATIONS_KEY = 'natangue_cotisations';

    constructor() {
        this.init();
    }

    private async init() {
        // 1. Load from LocalStorage first for instant UI
        const localMembers = this.storage.load(this.MEMBERS_KEY);
        const localCotis = this.storage.load(this.COTISATIONS_KEY);

        if (localMembers) this.members.set(localMembers);
        if (localCotis) this.cotisations.set(localCotis);

        // 2. Load from Supabase and sync
        try {
            await this.refreshFromSupabase();

            // 3. Subscribe to real-time changes
            this.supabase.subscribeToChanges('members', () => this.refreshFromSupabase());
            this.supabase.subscribeToChanges('cotisations', () => this.refreshFromSupabase());
        } catch (err) {
            console.error('Supabase error, staying on local data:', err);
            if (!localMembers && !localCotis) {
                this.migrateInitialData();
            }
        }
    }

    private async refreshFromSupabase() {
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
            membreId: c.membre_id // Handle mapping if database uses snake_case
        })) as unknown as Cotisation[];

        this.members.set(transformedMembers);
        this.cotisations.set(transformedCotis);

        // Update local cache
        this.saveToLocal();
    }

    private migrateInitialData() {
        const initialMembers: Member[] = [
            { id: 1, prenom: 'Vincent D.', nom: 'FAYE', dateNaissance: '1990-05-14', sexe: 'M', categorie: '10000', dateAdhesion: '2025-01-10' },
            { id: 2, prenom: 'Ibou', nom: 'Sy', dateNaissance: '1985-11-22', sexe: 'M', categorie: '10000', dateAdhesion: '2025-02-15' },
            { id: 3, prenom: 'Fatou', nom: 'Ndiaye', dateNaissance: '1998-03-08', sexe: 'F', categorie: '5000', dateAdhesion: '2025-04-20' },
            { id: 4, prenom: 'Abdourakhmane', nom: 'Diouf Niokhor', dateNaissance: '1992-09-30', sexe: 'M', categorie: '2000', dateAdhesion: '2025-05-12' }
        ];

        const initialCotisations: Cotisation[] = [
            { id: 101, membreId: 1, reference: 'COT-2026-001', mois: 'Janvier', annee: 2026, montantVerse: 10000, datePaiement: '2026-01-05', status: 'À jour' },
            { id: 102, membreId: 1, reference: 'COT-2026-002', mois: 'Février', annee: 2026, montantVerse: 10000, datePaiement: '2026-02-05', status: 'À jour' },
            { id: 201, membreId: 2, reference: 'COT-2026-003', mois: 'Janvier', annee: 2026, montantVerse: 10000, datePaiement: '2026-01-06', status: 'À jour' },
            { id: 202, membreId: 2, reference: 'COT-2026-004', mois: 'Février', annee: 2026, montantVerse: 10000, datePaiement: '2026-02-06', status: 'À jour' },
            { id: 301, membreId: 3, reference: 'COT-2026-005', mois: 'Janvier', annee: 2026, montantVerse: 5000, datePaiement: '2026-01-08', status: 'À jour' },
        ];

        this.members.set(initialMembers);
        this.cotisations.set(initialCotisations);
        this.saveToLocal();
    }

    private saveToLocal() {
        this.storage.save(this.MEMBERS_KEY, this.members());
        this.storage.save(this.COTISATIONS_KEY, this.cotisations());
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
        const nextId = Math.max(0, ...this.members().map(p => p.id)) + 1;
        try {
            await this.supabase.addMember({
                prenom: m.prenom,
                nom: m.nom,
                date_naissance: m.dateNaissance,
                sexe: m.sexe,
                categorie: m.categorie,
                date_adhesion: m.dateAdhesion
            });
        } catch (err) {
            console.error('Failed to save to Supabase:', err);
            // Fallback to local
            const newMember: Member = { ...m, id: nextId } as Member;
            this.members.update(prev => [...prev, newMember]);
            this.saveToLocal();
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
        } catch (err) {
            console.error('Failed to update Supabase:', err);
            // Fallback to local
            this.members.update(prev => prev.map(member => member.id === m.id ? m : member));
            this.saveToLocal();
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
        } catch (err) {
            console.error('Failed to save to Supabase:', err);
            // Fallback to local
            const newCotisation: Cotisation = { ...c, id: nextId, reference: ref, status };
            this.cotisations.update(prev => [...prev, newCotisation]);
            this.saveToLocal();
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
