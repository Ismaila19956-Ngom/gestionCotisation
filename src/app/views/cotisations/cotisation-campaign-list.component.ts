import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Campagne } from '../../models/cotisation-campaign.model';

@Component({
    selector: 'app-cotisation-campaign-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cotisation-campaign-list.component.html',
    styleUrls: ['./cotisation-campaign-list.component.scss']
})
export class CotisationCampaignListComponent implements OnInit {

    // Nouveaux champs pour le formulaire d'ajout
    nouvelleCampagne: Partial<Campagne> = {
        annee: new Date().getFullYear(),
        libelle: '',
        moisDebut: new Date().getMonth() + 1,
        moisFin: new Date().getMonth() + 1,
        dateDebutCotisation: '',
        dateFinCotisation: ''
    };

    annees: number[] = [];
    moisList = [
        { value: 1, label: 'Janvier' },
        { value: 2, label: 'Février' },
        { value: 3, label: 'Mars' },
        { value: 4, label: 'Avril' },
        { value: 5, label: 'Mai' },
        { value: 6, label: 'Juin' },
        { value: 7, label: 'Juillet' },
        { value: 8, label: 'Août' },
        { value: 9, label: 'Septembre' },
        { value: 10, label: 'Octobre' },
        { value: 11, label: 'Novembre' },
        { value: 12, label: 'Décembre' }
    ];

    campagnes: Campagne[] = [
        { id: 2, annee: 2026, libelle: 'Cotisation Navétane', moisDebut: 7, moisFin: 10, statut: 'EN_COURS' }
    ];

    isModalOpen = false;

    constructor(private router: Router) {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            this.annees.push(i);
        }
    }

    ngOnInit() { }

    openModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    saveCampagne() {
        const id = this.campagnes.length + 1;
        this.campagnes.push({
            ...this.nouvelleCampagne,
            id,
            statut: 'EN_COURS'
        } as Campagne);
        this.closeModal();
        this.nouvelleCampagne = {
            annee: new Date().getFullYear(),
            libelle: '',
            moisDebut: new Date().getMonth() + 1,
            moisFin: new Date().getMonth() + 1,
            dateDebutCotisation: '',
            dateFinCotisation: ''
        };
    }

    goToSuivi(campagneId: number) {
        this.router.navigate(['/cotisations', campagneId]);
    }

    getMoisLabel(val: number): string {
        return this.moisList.find(m => m.value === val)?.label || '';
    }
}
