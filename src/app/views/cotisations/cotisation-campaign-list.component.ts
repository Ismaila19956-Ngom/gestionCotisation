import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Campagne } from '../../models/cotisation-campaign.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-cotisation-campaign-list',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent],
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
        date_debut: '',
        date_fin: ''
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
    paginatedCampagnes: Campagne[] = [];

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalItems = 0;
    totalPages = 1;

    isModalOpen = false;
    isEditing = false;
    activeDropdown: number | null = null;

    constructor(private router: Router, private supabase: SupabaseService, private cdr: ChangeDetectorRef) {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            this.annees.push(i);
        }
    }

    async ngOnInit() {
        await this.loadCampagnes();
        
        // Si aucune campagne n'existe, on lance la synchro initiale
        if (this.campagnes.length === 0) {
            await this.supabase.initialSyncToSupabase();
            await this.loadCampagnes();
        }

        // Écouter les changements en temps réel sur les campagnes
        this.supabase.subscribeToChanges('campagnes', () => this.loadCampagnes());
        
        // Fermer le dropdown en cliquant ailleurs
        document.addEventListener('click', this.closeDropdowns.bind(this));
    }
    
    ngOnDestroy() {
        document.removeEventListener('click', this.closeDropdowns.bind(this));
    }

    closeDropdowns(event?: Event) {
        if (event) {
            const target = event.target as HTMLElement;
            if (!target.closest('.dropdown-container')) {
                this.activeDropdown = null;
            }
        } else {
            this.activeDropdown = null;
        }
    }

    toggleDropdown(id: number, event: Event) {
        event.stopPropagation();
        this.activeDropdown = this.activeDropdown === id ? null : id;
    }

    async loadCampagnes() {
        try {
            this.campagnes = await this.supabase.getCampagnes() as Campagne[];
            this.updatePagination();
            this.cdr.detectChanges(); // Force UI update after async fetch
        } catch (e) {
            console.error('Erreur chargement campagnes Supabase', e);
            this.campagnes = [];
            this.cdr.detectChanges();
        }
    }

    updatePagination() {
        this.totalItems = this.campagnes.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
        
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.paginatedCampagnes = this.campagnes.slice(start, end);
    }

    setPage(page: number) {
        this.currentPage = page;
        this.updatePagination();
    }

    onPageSizeChange(size: number) {
        this.itemsPerPage = size;
        this.currentPage = 1;
        this.updatePagination();
    }

    openModal() {
        this.isEditing = false;
        this.isModalOpen = true;
    }

    editCampagne(campagne: Campagne) {
        this.isEditing = true;
        this.nouvelleCampagne = {
            id: campagne.id,
            libelle: campagne.libelle,
            annee: campagne.annee,
            date_debut: campagne.date_debut,
            date_fin: campagne.date_fin
        };
        this.isModalOpen = true;
        this.activeDropdown = null;
    }

    closeModal() {
        this.isModalOpen = false;
        this.nouvelleCampagne = {
            annee: new Date().getFullYear(),
            libelle: '',
            moisDebut: new Date().getMonth() + 1,
            moisFin: new Date().getMonth() + 1,
            date_debut: '',
            date_fin: ''
        };
        this.isEditing = false;
    }

    async saveCampagne() {
        try {
            const campagneToSave: any = {
                libelle: this.nouvelleCampagne.libelle,
                annee: Number(this.nouvelleCampagne.annee),
                mois_debut: this.nouvelleCampagne.date_debut ? new Date(this.nouvelleCampagne.date_debut).getMonth() + 1 : 10,
                mois_fin: this.nouvelleCampagne.date_fin ? new Date(this.nouvelleCampagne.date_fin).getMonth() + 1 : 9,
                date_debut: this.nouvelleCampagne.date_debut ? String(this.nouvelleCampagne.date_debut) : null,
                date_fin: this.nouvelleCampagne.date_fin ? String(this.nouvelleCampagne.date_fin) : null,
                statut: 'EN_COURS'
            };

            if (this.isEditing && this.nouvelleCampagne.id) {
                campagneToSave.id = this.nouvelleCampagne.id;
            }

            await this.supabase.saveCampagne(campagneToSave);
            await this.loadCampagnes();
            this.closeModal();
            this.cdr.detectChanges();

            Swal.fire({
                title: 'Succès !',
                text: this.isEditing ? `Campagne modifiée avec succès !` : `Campagne sauvegardée avec succès sur Supabase !`,
                icon: 'success',
                confirmButtonColor: '#1b5e20'
            });

        } catch (e) {
            console.error("Erreur lors de la sauvegarde de la campagne", e);
            Swal.fire('Erreur', "Impossible de sauvegarder la campagne sur le cloud.", 'error');
        }
    }

    goToSuivi(campagneId: number) {
        this.router.navigate(['/cotisations', campagneId]);
    }

    async deleteCampagne(id: any) {
        Swal.fire({
            title: 'Confirmation',
            text: 'Voulez-vous vraiment supprimer cette campagne et toutes ses données sur Supabase ?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Non'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await this.supabase.deleteCampagne(Number(id));
                    await this.loadCampagnes();
                    Swal.fire('Supprimé !', 'La campagne a été supprimée du cloud.', 'success');
                } catch (e) {
                    console.error("Erreur suppression campagne", e);
                    Swal.fire('Erreur', "Impossible de supprimer la campagne.", 'error');
                }
            }
        });
    }

    getMoisLabel(val: number): string {
        return this.moisList.find(m => m.value === val)?.label || '';
    }
}
