import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Categorie, MembreCotisation } from '../../models/cotisation-campaign.model';
import { CotisationMemberImportModalComponent } from './cotisation-member-import-modal.component';

@Component({
    selector: 'app-cotisation-campaign-suivi',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, CotisationMemberImportModalComponent],
    templateUrl: './cotisation-campaign-suivi.component.html',
    styleUrls: ['./cotisation-campaign-suivi.component.scss']
})
export class CotisationCampaignSuiviComponent implements OnInit {

    campagneId!: number;

    categories: Categorie[] = [
        { id: 1, montant: 1000, actif: true },
        { id: 2, montant: 2000, actif: true },
        { id: 3, montant: 3000, actif: true },
        { id: 4, montant: 5000, actif: true },
        { id: 5, montant: 10000, actif: true },
    ];

    activeTab: number = 1000; // Par défaut, onglet 1000 FCFA
    showImportModal: boolean = false;

    membres: MembreCotisation[] = [
        { id: 1, campagneId: 1, categorieId: 1, memberId: 101, prenom: 'Aissatou', nom: 'Sow', sexe: 'F', dateNaissance: '12/05/1995', isPaid: true, datePaiement: '2026-04-10', unpaidMonthsCount: 0 },
        { id: 2, campagneId: 1, categorieId: 1, memberId: 102, prenom: 'Modou', nom: 'Diop', sexe: 'H', dateNaissance: '22/08/1990', isPaid: false, unpaidMonthsCount: 1 },
        { id: 3, campagneId: 1, categorieId: 4, memberId: 103, prenom: 'Mamadou', nom: 'Ndiaye', sexe: 'H', dateNaissance: '05/03/1988', isPaid: true, datePaiement: '2026-04-12', unpaidMonthsCount: 0 },
        { id: 4, campagneId: 1, categorieId: 5, memberId: 104, prenom: 'Ibrahima', nom: 'Fall', sexe: 'H', dateNaissance: '30/09/1992', isPaid: false, unpaidMonthsCount: 13 }
    ];

    // Modal Détails & Cotisation
    showDetailModal: boolean = false;
    selectedMembre: MembreCotisation | null = null;
    detailForm!: FormGroup;
    monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    availableMonths: string[] = [];

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.campagneId = Number(params.get('id'));
            this.initMockDataGlobale();
        });
    }

    // --- Génération globale des données mockées ---
    initMockDataGlobale() {
        // Configuration de la campagne (Juillet à Octobre)
        this.availableMonths = this.generateMonths(7, 10);

        this.membres.forEach(membre => {
            const cat = this.categories.find(c => c.id === membre.categorieId);
            const montantInitial = cat ? cat.montant : 0;

            membre.paiementsMensuels = this.availableMonths.map(mois => {
                let avanceMock = montantInitial; // Payé par défaut pour la plupart

                // Scénario : Modou Diop (ID: 102) a exactement 2 mois de retard (Aout et Septembre non payés)
                if (membre.memberId === 102) {
                    const moisIdx = this.getMoisIndex(mois);
                    if (moisIdx === 8 || moisIdx === 9) avanceMock = 0;
                }

                // Scénario : Ibrahima Fall (ID: 104) n'a rien payé du tout (Retard total)
                if (membre.memberId === 104) {
                    avanceMock = 0;
                }

                return {
                    mois: mois,
                    montant: montantInitial,
                    statut: this.calculateStatutMensuel(mois, avanceMock, montantInitial),
                    avance: avanceMock,
                    reste: Math.max(0, montantInitial - avanceMock)
                };
            });

            this.recalculerNombreMoisEnRetard(membre);
        });
    }


    setActiveTab(montant: number) {
        this.activeTab = montant;
    }

    getMembresByCategorie(montant: number) {
        const cat = this.categories.find(c => c.montant === montant);
        if (!cat) return [];
        return this.membres.filter(m => m.categorieId === cat.id);
    }

    // Calcule le montant total encaissé (payé) pour une catégorie donnée
    getTotalPayeByCategorie(montant: number): number {
        const membresCat = this.getMembresByCategorie(montant);
        return membresCat.reduce((totalCat, membre) => {
            const totalMembre = (membre.paiementsMensuels || []).reduce((sum, p) => sum + (p.avance || 0), 0);
            return totalCat + totalMembre;
        }, 0);
    }

    // Obtenir le total encaissé pour un membre en particulier
    getTotalEncaisseMembre(membre: MembreCotisation): number {
        return (membre.paiementsMensuels || []).reduce((sum, p) => sum + (p.avance || 0), 0);
    }

    openImportModal() {
        this.showImportModal = true;
    }

    closeImportModal() {
        this.showImportModal = false;
    }

    onMembersImported(selectedMembers: any[]) {
        const activeCat = this.categories.find(c => c.montant === this.activeTab);
        if (!activeCat) return;

        selectedMembers.forEach(m => {
            const newId = this.membres.length + 1;
            this.membres.push({
                id: newId,
                campagneId: this.campagneId,
                categorieId: activeCat.id,
                memberId: m.id,
                prenom: m.prenom,
                nom: m.nom,
                sexe: m.sexe,
                dateNaissance: m.dateNaissance || '01/01/2000',
                isPaid: false
            });
        });

        this.showImportModal = false;
        alert(`${selectedMembers.length} membre(s) importé(s) avec succès dans la catégorie ${this.activeTab} FCFA !`);
    }

    addCotisationGlobal() {
        console.log(`Ajout d'une nouvelle cotisation pour la catégorie : ${this.activeTab} FCFA`);
        const activeCat = this.categories.find(c => c.montant === this.activeTab);
        if (activeCat) {
            const newId = this.membres.length + 1;
            this.membres.push({
                id: newId,
                campagneId: this.campagneId,
                categorieId: activeCat.id,
                memberId: 200 + newId,
                prenom: 'Membre',
                nom: `Manuel ${newId}`,
                sexe: 'H',
                dateNaissance: '01/01/2000',
                isPaid: true,
                datePaiement: new Date().toISOString().split('T')[0]
            });
            alert(`Cotisation de ${this.activeTab} FCFA enregistrée !`);
        }
    }

    addCotisation(membre: MembreCotisation) {
        membre.isPaid = true;
        membre.datePaiement = new Date().toISOString().split('T')[0];
    }

    goBack() {
        this.router.navigate(['/cotisations']);
    }

    // --- Logique Modal Détails & Cotisation ---

    generateMonths(debut: number, fin: number) {
        let list = [];
        for (let i = debut; i <= fin; i++) {
            list.push(this.monthNames[i - 1]);
        }
        return list;
    }

    // ─── RÈGLE MÉTIER DU 10 DU MOIS ─────────────────────────────────────────────
    // Retourne l'index du mois (1-12) à partir du nom
    getMoisIndex(nomMois: string): number {
        return this.monthNames.indexOf(nomMois) + 1;
    }

    // Retourne vrai si la ligne est le mois courant
    isCurrentMonth(nomMois: string): boolean {
        const now = new Date();
        return this.getMoisIndex(nomMois) === now.getMonth() + 1;
    }

    /**
     * Calcule le statut d'un mois selon la règle métier :
     * - Mois futur       → "En cours"
     * - Mois passé, non payé → "En retard"
     * - Mois courant avant le 10 → "En cours"
     * - Mois courant après le 10, non payé → "En retard"
     * - Avance >= montant → "Payé"
     */
    calculateStatutMensuel(nomMois: string, avance: number, montant: number): 'Payé' | 'En cours' | 'En retard' {
        if (avance >= montant) return 'Payé';

        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentDay = now.getDate();
        const moisIndex = this.getMoisIndex(nomMois);

        if (moisIndex > currentMonth) {
            return 'En cours'; // Mois futur
        } else if (moisIndex < currentMonth) {
            return 'En retard'; // Mois passé non payé
        } else {
            // Mois courant
            return currentDay >= 10 ? 'En retard' : 'En cours';
        }
    }

    // Recalcule unpaidMonthsCount à partir des paiements mensuels
    recalculerNombreMoisEnRetard(membre: MembreCotisation) {
        if (!membre.paiementsMensuels) return;
        membre.unpaidMonthsCount = membre.paiementsMensuels.filter(
            p => p.statut === 'En retard'
        ).length;
    }
    // ─────────────────────────────────────────────────────────────────────────────

    openDetailModal(membre: MembreCotisation) {
        this.selectedMembre = membre;
        this.showDetailModal = true;
    }

    onAvanceChange(paiement: any) {
        paiement.reste = Math.max(0, (paiement.montant || 0) - (paiement.avance || 0));
        if (paiement.reste <= 0) {
            paiement.statut = 'Payé';
            paiement.reste = 0;
        } else {
            // Recalcul dynamique selon la règle du 10
            paiement.statut = this.calculateStatutMensuel(
                paiement.mois,
                paiement.avance,
                paiement.montant
            );
        }
        // Mettre à jour le badge dans le tableau principal
        if (this.selectedMembre) {
            this.recalculerNombreMoisEnRetard(this.selectedMembre);
        }
    }

    closeDetailModal() {
        this.showDetailModal = false;
        this.selectedMembre = null;
    }

    formatMontant(amount: number | string): string {
        if (amount === undefined || amount === null) return '0 F CFA';
        return amount.toLocaleString() + ' F CFA';
    }

    onSaveDetail() {
        // Ici on sauvegarderait les modifications via le service
        console.log('--- Saving Detail & Cotisation ---', this.selectedMembre);
        alert(`Suivi enregistré pour ${this.selectedMembre?.prenom} ${this.selectedMembre?.nom}`);
        this.closeDetailModal();
    }
}
