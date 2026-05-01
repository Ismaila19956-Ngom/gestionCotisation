import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface MemberRow {
    id: number;
    prenom: string;
    nom: string;
    categorieId: number;
    montantDu: number;
    statut: string;
    avance: number;
    reste: number;
    observation: string;
}

@Component({
    selector: 'app-cotisation-period',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cotisation-period.component.html',
    styleUrls: ['./cotisation-period.component.scss']
})
export class CotisationPeriodComponent implements OnInit {
    private supabase = inject(SupabaseService);

    readonly CATEGORIE_MAP: { [key: number]: number } = {
        1: 1000, 2: 2000, 3: 3000, 4: 5000, 5: 10000
    };

    months = [
        'Octobre', 'Novembre', 'Décembre',
        'Janvier', 'Février', 'Mars',
        'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre'
    ];

    selectedMonth = 'Janvier';
    isLoading = false;
    membersData: MemberRow[] = [];

    get totalEncaisse(): number {
        return this.membersData.reduce((sum, m) => sum + (m.avance || 0), 0);
    }

    get totalAttendu(): number {
        return this.membersData.reduce((sum, m) => sum + (m.montantDu || 0), 0);
    }

    get membresEnRetard(): number {
        return this.membersData.filter(m => m.statut === 'En retard').length;
    }

    ngOnInit() {
        this.loadData();
    }

    async onPeriodChange() {
        await this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.membersData = [];
        try {
            const campagne = await this.supabase.getActiveCampagne();

            // Get all members for this campaign
            const { data: membres } = await this.supabase.client
                .from('membres')
                .select('*')
                .eq('campagne_id', campagne.id)
                .order('categorie_id', { ascending: false });

            if (!membres) { this.isLoading = false; return; }

            // Get cotisations for the selected month
            const { data: cotisations } = await this.supabase.client
                .from('cotisations')
                .select('*')
                .eq('campagne_id', campagne.id)
                .eq('mois', this.selectedMonth);

            const cotisMap = new Map<number, any>();
            (cotisations || []).forEach((c: any) => cotisMap.set(c.membre_id, c));

            this.membersData = membres.map((m: any) => {
                const cot = cotisMap.get(m.id);
                // Le montant est maintenant directement dans categorie_id
                const montantDu = Number(m.categorie_id) || 0;
                return {
                    id: m.id,
                    prenom: m.prenom,
                    nom: m.nom,
                    categorieId: m.categorie_id,
                    montantDu,
                    statut: cot?.statut || 'En retard',
                    avance: Number(cot?.avance) || 0,
                    reste: Number(cot?.reste) || montantDu,
                    observation: cot?.observation || ''
                };
            });
        } catch (err) {
            console.error('Erreur chargement cotisations:', err);
        }
        this.isLoading = false;
    }

    formatMontant(v: number): string {
        return new Intl.NumberFormat('fr-FR').format(v) + ' F';
    }

    getStatutClass(statut: string): string {
        const map: { [k: string]: string } = {
            'Payé': 'status-paid',
            'En cours': 'status-pending',
            'En retard': 'status-late',
            'Partiel': 'status-partial',
            'Avance': 'status-advance'
        };
        return map[statut] || 'status-pending';
    }
}
