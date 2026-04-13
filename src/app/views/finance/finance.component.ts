import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-finance',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './finance.component.html',
    styleUrls: ['./finance.component.scss']
})
export class FinanceComponent {
    showModal = signal(false);

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

    // Pagination signals
    currentPage = signal(1);
    itemsPerPage = signal(10);
    totalItems = signal(2); // Initial mock value based on current table rows

    openModal() {
        console.log('Opening modal');
        this.showModal.set(true);
    }

    closeModal() {
        console.log('Closing modal');
        this.showModal.set(false);
    }

    // Pagination methods
    setPage(page: number) {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    totalPages(): number {
        return Math.ceil(this.totalItems() / this.itemsPerPage());
    }
}
