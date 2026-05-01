import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MemberService } from '../../../services/member.service';
import { Member, CategorieCotisation } from '../../../models/cotisation.model';

@Component({
    selector: 'app-cotisation-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cotisation-list.component.html',
    styleUrls: ['./cotisation-list.component.scss']
})
export class CotisationListComponent implements OnInit {
    private memberService = inject(MemberService);

    members = this.memberService.getMembers();
    allCotisations = this.memberService.getAllCotisations();

    groupedCotisations = computed(() => {
        const allm = this.members();
        return [
            {
                label: 'Catégorie 10 000 F',
                members: allm.filter(m => Number(m.categorie_id) === 10000),
                color: 'success'
            },
            {
                label: 'Catégorie 5 000 F',
                members: allm.filter(m => Number(m.categorie_id) === 5000),
                color: 'primary'
            },
            {
                label: 'Catégorie 3 000 F',
                members: allm.filter(m => Number(m.categorie_id) === 3000),
                color: 'warning'
            },
            {
                label: 'Catégorie 2 000 F',
                members: allm.filter(m => Number(m.categorie_id) === 2000),
                color: 'info'
            },
            {
                label: 'Catégorie 1 000 F',
                members: allm.filter(m => Number(m.categorie_id) === 1000),
                color: 'secondary'
            }
        ];
    });

    ngOnInit(): void { }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }

    getLastPayment(memberId: number) {
        const payments = this.allCotisations().filter(c => c.membreId === memberId);
        return payments.length > 0 ? payments[payments.length - 1] : null;
    }
}
