import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CotisationService } from '../../services/cotisation.service';
import { MemberService } from '../../services/member.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    private cotisationService = inject(CotisationService);
    private memberService = inject(MemberService);

    stats = this.cotisationService.getStats();
    cotisations = this.memberService.getAllCotisations();

    recentPayments = computed(() => {
        // Get all cotisations, map with member name, sort desc
        const cotis = this.cotisations();
        return cotis.map(c => {
            const m = this.memberService.getMemberById(c.membreId);
            return { ...c, memberName: m ? `${m.prenom} ${m.nom}` : 'Inconnu' };
        }).sort((a, b) => b.id - a.id).slice(0, 5);
    });

    ngOnInit(): void { }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }
}
