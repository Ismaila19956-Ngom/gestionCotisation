import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { Member, CategorieCotisation } from '../../models/cotisation.model';
import { ContributionFormComponent } from './contribution-form.component';
import { MemberFormComponent } from './member-form.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-member-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ContributionFormComponent, MemberFormComponent, RouterLink, PaginationComponent],
    templateUrl: './member-list.component.html',
    styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit {
    private memberService = inject(MemberService);
    private router = inject(Router);

    selectedCategory = signal<CategorieCotisation | 'all'>('all');
    selectedYear = signal<number | 'all'>('all');

    availableYears = Array.from({ length: 11 }, (_, i) => 2020 + i).reverse();

    members = this.memberService.getMembers();

    filteredMembers = computed(() => {
        const cat = this.selectedCategory();
        const year = this.selectedYear();
        let list = this.members();

        if (cat !== 'all') {
            list = list.filter(m => m.categorie === cat);
        }

        if (year !== 'all') {
            list = list.filter(m => {
                const joinYear = new Date(m.dateAdhesion).getFullYear();
                return joinYear === Number(year);
            });
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

    onSaveMember(memberData: Partial<Member>) {
        console.log('Saving member data:', memberData);
        if (this.memberToEdit()) {
            this.memberService.updateMember({ ...this.memberToEdit()!, ...memberData } as Member);
        } else {
            this.memberService.addMember(memberData as Omit<Member, 'id'>);
        }
        this.closeModals();
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
