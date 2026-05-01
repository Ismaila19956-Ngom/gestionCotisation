import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface ImportableMember {
    id: number;
    codeMembre: string;
    prenom: string;
    nom: string;
    telephone: string;
    selected?: boolean;
    category?: number;
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

    constructor(private supabase: SupabaseService) {}

    searchTerm: string = '';

    allMembers: ImportableMember[] = [];
    filteredMembers: ImportableMember[] = [];
    isLoading: boolean = false;

    // Pagination
    currentPage: number = 1;
    pageSize: number = 5;

    async ngOnInit() {
        // Tentative de récupération des vraies données
        try {
            const realMembers = await this.supabase.getAllGlobalMembers();
            if (realMembers && realMembers.length > 0) {
                this.allMembers = realMembers.map((m, index) => ({
                    id: index + 1,
                    codeMembre: `MEM-${(index + 1).toString().padStart(4, '0')}`,
                    prenom: m.prenom,
                    nom: m.nom,
                    telephone: m.telephone || '--',
                    sexe: m.sexe
                }));
            } else {
                this.useStaticFallback();
            }
        } catch (e) {
            this.useStaticFallback();
        } finally {
            this.onSearch();
        }
    }

    private useStaticFallback() {
        // Liste de secours directe pour ne dépendre de rien
        const fallback = [
            { prenom: 'Momodou', nom: 'SOW', telephone: '774389922' },
            { prenom: 'Fatou', nom: 'BALDE', telephone: '789876543' },
            { prenom: 'Cheikh', nom: 'NDIAYE', telephone: '701112233' },
            { prenom: 'Aminata', nom: 'DIOP', telephone: '764445566' },
            { prenom: 'Omar', nom: 'SY', telephone: '775556677' },
            { prenom: 'Mariama', nom: 'SANE', telephone: '783334455' },
            { prenom: 'Abdoulaye', nom: 'GUEYE', telephone: '706667788' }
        ];

        this.allMembers = fallback.map((m, index) => ({
            id: 1000 + index,
            codeMembre: `FIX-${(index + 1).toString().padStart(4, '0')}`,
            prenom: m.prenom,
            nom: m.nom,
            telephone: m.telephone,
            category: 2000
        }));
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
        const term = this.searchTerm.toLowerCase().trim();
        const terms = term.split(' ').filter(t => t.length > 0);

        this.filteredMembers = this.allMembers
            .filter(m => !this.excludeIds.includes(m.id))
            .filter(m => {
                if (terms.length === 0) return true;
                const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
                const code = m.codeMembre.toLowerCase();
                const tel = m.telephone.toLowerCase();
                
                // Le membre doit correspondre à TOUS les mots de la recherche
                return terms.every(t => 
                    fullName.includes(t) || code.includes(t) || tel.includes(t)
                );
            });
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
        this.filteredMembers.forEach(m => {
            m.selected = isChecked;
            if (isChecked && !m.category) m.category = 2000;
        });
    }

    onToggleMember(member: ImportableMember) {
        if (member.selected && !member.category) {
            member.category = 2000; // Par défaut
        }
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
