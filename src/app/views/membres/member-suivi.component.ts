import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { Member, Cotisation } from '../../models/cotisation.model';
import { ContributionFormComponent } from './contribution-form.component';

@Component({
    selector: 'app-member-suivi',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ContributionFormComponent],
    templateUrl: './member-suivi.component.html',
    styleUrls: ['./member-suivi.component.scss']
})
export class MemberSuiviComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private memberService = inject(MemberService);

    protected readonly Number = Number;

    member = signal<Member | null>(null);
    searchTerm = signal('');
    selectedYear = signal<number | null>(new Date().getFullYear());

    availableYears = Array.from({ length: 11 }, (_, i) => 2020 + i).reverse();

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

    history = computed(() => {
        const m = this.member();
        if (!m) return [];

        const term = this.searchTerm().toLowerCase();
        const year = this.selectedYear();
        let cotis = this.memberService.getContributionByMemberId(m.id)();

        // Filter by year if selected
        if (year !== null) {
            cotis = cotis.filter(c => c.annee === Number(year));
        }

        if (!term) return cotis;

        return cotis.filter(c =>
            c.mois.toLowerCase().includes(term) ||
            c.datePaiement.includes(term) ||
            c.reference.toLowerCase().includes(term)
        );
    });

    // Pagination signals
    currentPage = signal(1);
    itemsPerPage = signal(10);
    totalItems = computed(() => this.history().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()) || 1);

    paginatedHistory = computed(() => {
        const start = (this.currentPage() - 1) * this.itemsPerPage();
        const end = start + this.itemsPerPage();
        return this.history().slice(start, end);
    });

    setPage(page: number) {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    showContributionForm = signal(false);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const found = this.memberService.getMemberById(Number(id));
            if (found) {
                this.member.set(found);
            } else {
                this.router.navigate(['/membres']);
            }
        }
    }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }

    onAddContribution() {
        console.log('Opening contribution form modal...');
        this.showContributionForm.set(true);
    }

    closeModal() {
        console.log('Closing contribution form modal...');
        this.showContributionForm.set(false);
    }
}
