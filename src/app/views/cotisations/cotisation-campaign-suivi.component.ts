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
            // Simuler le chargement des données pour this.campagneId
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

    openDetailModal(membre: MembreCotisation) {
        this.selectedMembre = membre;
        const cat = this.categories.find(c => c.id === membre.categorieId);
        const montantInitial = cat ? cat.montant : 0;

        // Si le membre n'a pas encore de paiements mensuels, on les initialise
        if (!membre.paiementsMensuels || membre.paiementsMensuels.length === 0) {
            // Configuration demandée : Juillet (7) à Octobre (10)
            this.availableMonths = this.generateMonths(7, 10);
            membre.paiementsMensuels = this.availableMonths.map(m => ({
                mois: m,
                montant: montantInitial,
                statut: 'En cours',
                avance: 0,
                reste: montantInitial
            }));
        }

        this.showDetailModal = true;
    }

    onAvanceChange(paiement: any) {
        paiement.reste = (paiement.montant || 0) - (paiement.avance || 0);
        if (paiement.reste <= 0) {
            paiement.statut = 'Payé';
            paiement.reste = 0;
        } else if (paiement.avance > 0) {
            paiement.statut = 'En cours';
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
