import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ImportableMember {
    id: number;
    codeMembre: string;
    prenom: string;
    nom: string;
    telephone: string;
    selected?: boolean;
}

@Component({
    selector: 'app-cotisation-member-import-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cotisation-member-import-modal.component.html',
    styleUrls: ['./cotisation-member-import-modal.component.scss']
})
export class CotisationMemberImportModalComponent implements OnInit {
    @Input() excludeIds: number[] = [];
    @Output() close = new EventEmitter<void>();
    @Output() import = new EventEmitter<ImportableMember[]>();

    searchTerm: string = '';

    // Simulation d'une liste de membres existants dans le système
    allMembers: ImportableMember[] = [
        { id: 201, codeMembre: 'MBR583026', prenom: 'Momodou', nom: 'SOW', telephone: '774389922' },
        { id: 202, codeMembre: 'MBR583027', prenom: 'Fatou', nom: 'BALDE', telephone: '789876543' },
        { id: 203, codeMembre: 'MBR583028', prenom: 'Cheikh', nom: 'NDIAYE', telephone: '701112233' },
        { id: 204, codeMembre: 'MBR583029', prenom: 'Aminata', nom: 'DIOP', telephone: '764445566' },
        { id: 205, codeMembre: 'MBR583030', prenom: 'Omar', nom: 'SY', telephone: '775556677' },
        { id: 206, codeMembre: 'MBR583031', prenom: 'Mariama', nom: 'SANE', telephone: '783334455' },
        { id: 207, codeMembre: 'MBR583032', prenom: 'Abdoulaye', nom: 'GUEYE', telephone: '706667788' },
    ];

    filteredMembers: ImportableMember[] = [];

    // Pagination
    currentPage: number = 1;
    pageSize: number = 5;

    ngOnInit() {
        this.filteredMembers = this.allMembers.filter(m => !this.excludeIds.includes(m.id));
    }

    get paginatedMembers(): ImportableMember[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredMembers.slice(startIndex, startIndex + this.pageSize);
    }

    get totalPages(): number {
        return Math.ceil(this.filteredMembers.length / this.pageSize);
    }

    onSearch() {
        this.currentPage = 1;
        const term = this.searchTerm.toLowerCase();
        this.filteredMembers = this.allMembers
            .filter(m => !this.excludeIds.includes(m.id))
            .filter(m =>
                m.prenom.toLowerCase().includes(term) ||
                m.nom.toLowerCase().includes(term) ||
                m.telephone.includes(term) ||
                m.codeMembre.toLowerCase().includes(term)
            );
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    toggleSelectAll(event: any) {
        const isChecked = event.target.checked;
        this.filteredMembers.forEach(m => m.selected = isChecked);
    }

    isAllSelected(): boolean {
        return this.filteredMembers.length > 0 && this.filteredMembers.every(m => m.selected);
    }

    getSelectedCount(): number {
        return this.filteredMembers.filter(m => m.selected).length;
    }

    onConfirm() {
        const selected = this.filteredMembers.filter(m => m.selected);
        if (selected.length > 0) {
            this.import.emit(selected);
        }
    }

    onCancel() {
        this.close.emit();
    }
}
