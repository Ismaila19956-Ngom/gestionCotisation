import { Injectable, signal, computed } from '@angular/core';
import { Member, Cotisation, CategorieCotisation, StatutCotisation } from '../models/cotisation.model';

@Injectable({
    providedIn: 'root'
})
export class MemberService {
    private members = signal<Member[]>([
        {
            id: 1,
            prenom: 'Vincent D.',
            nom: 'FAYE',
            dateNaissance: '1990-05-14',
            sexe: 'M',
            categorie: '10000',
            dateAdhesion: '2025-01-10'
        },
        {
            id: 2,
            prenom: 'Ibou',
            nom: 'Sy',
            dateNaissance: '1985-11-22',
            sexe: 'M',
            categorie: '10000',
            dateAdhesion: '2025-02-15'
        },
        {
            id: 3,
            prenom: 'Fatou',
            nom: 'Ndiaye',
            dateNaissance: '1998-03-08',
            sexe: 'F',
            categorie: '5000',
            dateAdhesion: '2025-04-20'
        },
        {
            id: 4,
            prenom: 'Abdourakhmane',
            nom: 'Diouf Niokhor',
            dateNaissance: '1992-09-30',
            sexe: 'M',
            categorie: '2000',
            dateAdhesion: '2025-05-12'
        }
    ]);

    private cotisations = signal<Cotisation[]>([
        { id: 101, membreId: 1, reference: 'COT-2026-001', mois: 'Janvier', annee: 2026, montantVerse: 10000, datePaiement: '2026-01-05', status: 'À jour' },
        { id: 102, membreId: 1, reference: 'COT-2026-002', mois: 'Février', annee: 2026, montantVerse: 10000, datePaiement: '2026-02-05', status: 'À jour' },
        { id: 201, membreId: 2, reference: 'COT-2026-003', mois: 'Janvier', annee: 2026, montantVerse: 10000, datePaiement: '2026-01-06', status: 'À jour' },
        { id: 202, membreId: 2, reference: 'COT-2026-004', mois: 'Février', annee: 2026, montantVerse: 10000, datePaiement: '2026-02-06', status: 'À jour' },
        { id: 301, membreId: 3, reference: 'COT-2026-005', mois: 'Janvier', annee: 2026, montantVerse: 5000, datePaiement: '2026-01-08', status: 'À jour' },
    ]);

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

    // Explicitly requested function name
    getContributionByMemberId(id: number) {
        return this.getMemberHistory(id);
    }

    getAllCotisations() {
        return this.cotisations.asReadonly();
    }

    addContribution(c: Omit<Cotisation, 'id' | 'status' | 'reference'>) {
        this.cotisations.update(prev => {
            const member = this.getMemberById(c.membreId);
            const monthlyAmount = member ? parseInt(member.categorie) : 0;

            let status: StatutCotisation = 'À jour';
            if (c.montantVerse > monthlyAmount) status = 'Avance';
            else if (c.montantVerse < monthlyAmount) status = 'Rappel';

            const nextId = Math.max(0, ...prev.map(p => p.id)) + 1;
            const ref = `COT-${c.annee}-${nextId.toString().padStart(3, '0')}`;

            const newCotisation: Cotisation = {
                ...c,
                id: nextId,
                reference: ref,
                status
            };
            return [...prev, newCotisation];
        });
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
