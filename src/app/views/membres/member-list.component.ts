import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { SupabaseService } from '../../services/supabase.service';
import { Member, CategorieCotisation } from '../../models/cotisation.model';
import { ContributionFormComponent } from './contribution-form.component';
import { MemberFormComponent } from './member-form.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-member-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ContributionFormComponent, MemberFormComponent, RouterLink, PaginationComponent],
    templateUrl: './member-list.component.html',
    styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit {
    private memberService = inject(MemberService);
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    // ── Search ────────────────────────────────────────────
    searchQuery = signal('');
    showSearchDropdown = signal(false);
    showMemberPopup = signal(false);
    popupMember = signal<Member | null>(null);
    popupCotisations = signal<any[]>([]);
    isLoadingPopup = signal(false);

    searchResults = computed(() => {
        const q = this.searchQuery().trim().toLowerCase();
        if (q.length < 2) return [];
        return this.members().filter(m =>
            m.prenom.toLowerCase().includes(q) ||
            m.nom.toLowerCase().includes(q)
        ).slice(0, 8);
    });

    readonly MONTHS = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre'];
    readonly MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    selectedCategory = signal<CategorieCotisation | 'all'>('all');
    selectedSexe = signal<'all' | 'M' | 'F'>('all');

    availableYears = Array.from({ length: 11 }, (_, i) => 2020 + i).reverse();

    members = this.memberService.getMembers();

    filteredMembers = computed(() => {
        const cat = this.selectedCategory();
        const sexe = this.selectedSexe();
        let list = this.members();

        if (cat !== 'all') {
            const targetCat = Number(cat);
            list = list.filter(m => Number(m.categorie_id) === targetCat);
        }

        if (sexe !== 'all') {
            list = list.filter(m => m.sexe === sexe);
        }

        return list;
    });

    // Pagination signals
    currentPage = signal(1);
    itemsPerPage = signal(10);
    totalItems = computed(() => this.filteredMembers().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()) || 1);

    paginatedMembers = computed(() => {
        const start = (this.currentPage() - 1) * this.itemsPerPage();
        const end = start + this.itemsPerPage();
        return this.filteredMembers().slice(start, end);
    });

    setPage(page: number) {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    selectedMember = signal<Member | null>(null);
    showContributionForm = signal(false);

    // New Member form state
    showMemberForm = signal(false);
    memberToEdit = signal<Member | undefined>(undefined);

    // Dropdown state
    activeDropdownId = signal<number | null>(null);

    toggleDropdown(id: number, event: Event) {
        event.stopPropagation();
        if (this.activeDropdownId() === id) {
            this.activeDropdownId.set(null);
        } else {
            this.activeDropdownId.set(id);
        }
    }

    @HostListener('document:click')
    closeDropdowns() {
        this.activeDropdownId.set(null);
        this.showSearchDropdown.set(false);
    }

    onSearchInput(event: Event) {
        event.stopPropagation();
        this.showSearchDropdown.set(true);
    }

    stopPropagation(event: Event) {
        event.stopPropagation();
    }

    async onSelectSearchResult(member: Member, event: Event) {
        event.stopPropagation();
        this.showSearchDropdown.set(false);
        this.searchQuery.set('');
        this.popupMember.set(member);
        this.isLoadingPopup.set(true);
        this.showMemberPopup.set(true);
        this.popupCotisations.set([]);

        try {
            const cotisRaw = await this.supabase.getCotisationsByMembre(member.id);
            // Construire le calendrier complet de 12 mois
            const calendar = this.MONTHS.map(mois => {
                const found = cotisRaw.find((c: any) => c.mois === mois);
                return {
                    mois,
                    montant: found ? Number(found.montant) : Number(member.categorie_id),
                    avance: found ? Number(found.avance) : 0,
                    reste: found ? Number(found.reste) : Number(member.categorie_id),
                    statut: found ? found.statut : 'En retard',
                    isCurrent: this.isCurrentMonth(mois)
                };
            });
            this.popupCotisations.set(calendar);
        } catch (e) {
            console.error('Erreur chargement cotisations popup:', e);
        } finally {
            this.isLoadingPopup.set(false);
        }
    }

    closeMemberPopup() {
        this.showMemberPopup.set(false);
        this.popupMember.set(null);
        this.popupCotisations.set([]);
    }

    isCurrentMonth(mois: string): boolean {
        const now = new Date();
        return mois === this.MONTH_NAMES[now.getMonth()];
    }

    getTotalPayeMembre(): number {
        return this.popupCotisations().reduce((s, c) => s + (c.avance || 0), 0);
    }

    getRetardCount(): number {
        return this.popupCotisations().filter(c =>
            (c.statut === 'En retard') && this.isPastOrCurrentMonth(c.mois)
        ).length;
    }

    isPastOrCurrentMonth(mois: string): boolean {
        const now = new Date();
        const currentName = this.MONTH_NAMES[now.getMonth()];
        const currentIdx = this.MONTHS.indexOf(currentName);
        const targetIdx = this.MONTHS.indexOf(mois);
        return targetIdx <= currentIdx;
    }

    ngOnInit(): void { }

    onAddMember() {
        this.memberToEdit.set(undefined);
        this.showMemberForm.set(true);
    }

    onEditMember(member: Member) {
        this.memberToEdit.set(member);
        this.showMemberForm.set(true);
        this.activeDropdownId.set(null); // Close dropdown
    }

    async onDeleteMember(member: Member) {
        const result = await Swal.fire({
            title: 'Confirmer la suppression',
            html: `Êtes-vous sûr de vouloir supprimer <strong>${member.prenom} ${member.nom}</strong> ?<br><small style="color:#e53e3e">Ses cotisations seront également supprimées.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c62828',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                await this.memberService.deleteMember(member.id);
                this.activeDropdownId.set(null);
                Swal.fire({
                    title: 'Supprimé !',
                    text: `${member.prenom} ${member.nom} a été supprimé avec succès.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err: any) {
                Swal.fire('Erreur', `Impossible de supprimer le membre : ${err.message || err}`, 'error');
            }
        }
    }

    async onSaveMember(memberData: Partial<Member>) {
        try {
            if (this.memberToEdit()) {
                await this.memberService.updateMember({ ...this.memberToEdit()!, ...memberData } as Member);
                Swal.fire('Succès', 'Membre mis à jour avec succès', 'success');
            } else {
                await this.memberService.addMember(memberData as Omit<Member, 'id'>);
                Swal.fire('Succès', 'Membre ajouté avec succès', 'success');
            }
            
            // Rediriger le filtre vers la catégorie du membre pour qu'il soit visible
            if (memberData.categorie_id) {
                this.selectedCategory.set(Number(memberData.categorie_id) as any);
                this.currentPage.set(1);
            }
            
            this.closeModals();
        } catch (err: any) {
            console.error('Save error details:', err);
            const errorMsg = err.error_description || err.message || JSON.stringify(err);
            Swal.fire('Erreur', `Erreur lors de l'enregistrement : ${errorMsg}`, 'error');
        }
    }

    onAddContribution(member: Member) {
        this.selectedMember.set(member);
        this.showContributionForm.set(true);
    }

    onViewDetails(member: Member) {
        this.router.navigate(['/membres/suivi', member.id]);
    }

    closeModals() {
        this.showContributionForm.set(false);
        this.showMemberForm.set(false);
        this.selectedMember.set(null);
        this.memberToEdit.set(undefined);
    }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }

    formatSexe(sexe: string): string {
        return sexe === 'M' ? 'Homme' : 'Femme';
    }
}
