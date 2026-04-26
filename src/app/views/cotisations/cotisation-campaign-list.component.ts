import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Campagne } from '../../models/cotisation-campaign.model';
import { membresCampagneData } from '../../models/membres_asc.data';

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

    campagnes: Campagne[] = [];

    isModalOpen = false;

    constructor(private router: Router) {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            this.annees.push(i);
        }
    }

    ngOnInit() {
        this.loadCampagnesFromStorage();
    }

    // --- Gestion du LocalStorage pour les campagnes ---
    get storageKey(): string {
        return 'natangue_campagnes';
    }

    loadCampagnesFromStorage() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                this.campagnes = JSON.parse(data);
            } catch (e) {
                console.error('Erreur lecture localStorage', e);
                this.campagnes = [];
            }
        }
    }

    saveCampagnesToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.campagnes));
    }

    openModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    async saveCampagne() {
        if (this.nouvelleCampagne.dateDebutCotisation) {
            this.nouvelleCampagne.moisDebut = new Date(this.nouvelleCampagne.dateDebutCotisation).getMonth() + 1;
        }
        if (this.nouvelleCampagne.dateFinCotisation) {
            this.nouvelleCampagne.moisFin = new Date(this.nouvelleCampagne.dateFinCotisation).getMonth() + 1;
        }

        const id = this.campagnes.length > 0 ? Math.max(...this.campagnes.map(c => c.id)) + 1 : 1;
        
        const mDebut = this.nouvelleCampagne.moisDebut || 1;
        const mFin = this.nouvelleCampagne.moisFin || 12;
        
        // Générer tous les mois de la période
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        let tousLesMois: string[] = [];
        let current = mDebut;
        while (true) {
            tousLesMois.push(monthNames[current - 1]);
            if (current === mFin) break;
            current++;
            if (current > 12) current = 1;
        }

        this.campagnes.push({
            ...this.nouvelleCampagne,
            id,
            statut: 'EN_COURS'
        } as Campagne);
        this.saveCampagnesToStorage();
        this.closeModal();

        // Importer automatiquement les membres du JSON (via notre fichier TypeScript)
        try {
            let membresCampagne = JSON.parse(JSON.stringify(membresCampagneData));
            
            membresCampagne = membresCampagne.map((m: any) => {
                const nameParts = m.nom ? m.nom.split(' ') : [''];
                const nom = nameParts.length > 1 ? nameParts.pop() : m.nom;
                const prenom = nameParts.length > 0 ? nameParts.join(' ') : '';
                
                const jsonPaiements = m.paiements || [];
                
                // Fonction locale pour déterminer le statut initial exact
                const determineStatut = (nomMois: string) => {
                    const now = new Date();
                    const currentMonth = now.getMonth() + 1;
                    const currentDay = now.getDate();
                    const moisIndex = monthNames.indexOf(nomMois) + 1;
                    
                    // Simple check (sans gestion complexe des années croisées pour l'instant)
                    if (moisIndex > currentMonth) return 'En cours';
                    if (moisIndex < currentMonth) return 'En retard';
                    return currentDay >= 10 ? 'En retard' : 'En cours';
                };

                // Fusionner avec la liste complète de la campagne
                const paiementsMensuels = tousLesMois.map(nomMois => {
                    const existing = jsonPaiements.find((p: any) => p.mois === nomMois);
                    if (existing) {
                        return existing;
                    } else {
                        return {
                            mois: nomMois,
                            montant: m.categorie,
                            statut: determineStatut(nomMois),
                            avance: 0,
                            reste: m.categorie,
                            observation: ''
                        };
                    }
                });

                // Calcul basique pour le tag "En retard" initial
                const unpaidMonthsCount = paiementsMensuels.filter((p: any) => p.statut === 'En retard' || (p.avance === 0 && p.statut !== 'En cours')).length;
                delete m.paiements;

                return {
                    ...m,
                    prenom: prenom,
                    nom: nom,
                    sexe: m.sexe === 'Femme' ? 'F' : 'H',
                    campagneId: id,
                    paiementsMensuels: paiementsMensuels,
                    unpaidMonthsCount: unpaidMonthsCount
                };
            });
            
            // Sauvegarder dans le localStorage
            const keyMembres = `natangue_campagne_${id}_membres_v2`;
            localStorage.setItem(keyMembres, JSON.stringify(membresCampagne));
            
            // Calculer un total de la campagne pour le notifier (facultatif)
            const totalGeneral = membresCampagne.reduce((total: number, m: any) => total + (m.montantTotalEncaisse || 0), 0);
            
            alert(`Campagne sauvegardée avec succès ! ${membresCampagne.length} membres importés. (Total estimé : ${totalGeneral} FCFA)`);
        } catch (e) {
            console.error("Erreur lors de l'import des membres", e);
            alert("Campagne sauvegardée mais une erreur s'est produite lors de l'import des membres.");
        }

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

    deleteCampagne(id: any) {
        if (window.confirm('Voulez-vous vraiment supprimer cette campagne et toutes ses données de cotisation ?')) {
            // Supprimer la campagne de la liste en gérant la conversion type string/number
            this.campagnes = this.campagnes.filter(c => Number(c.id) !== Number(id));
            this.saveCampagnesToStorage();
            
            // Supprimer les membres associés à cette campagne du localStorage
            localStorage.removeItem(`natangue_campagne_${id}_membres_v2`);
        }
    }

    getMoisLabel(val: number): string {
        return this.moisList.find(m => m.value === val)?.label || '';
    }
}
