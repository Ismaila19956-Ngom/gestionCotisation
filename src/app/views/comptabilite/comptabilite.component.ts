import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../services/member.service';

@Component({
    selector: 'app-comptabilite',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './comptabilite.component.html',
    styleUrls: ['./comptabilite.component.scss']
})
export class ComptabiliteComponent {
    private memberService = inject(MemberService);

    // Placeholder data
    totalRecette = 1250000;
    depenses = 450000;
    solde = 800000;

    stats = [
        { label: 'Cotisations encaissées', value: 120, trend: '+12%' },
        { label: 'Membres à jour', value: '85%', trend: '+5%' },
        { label: 'Retards de paiement', value: 15, trend: '-2' }
    ];

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }
}
