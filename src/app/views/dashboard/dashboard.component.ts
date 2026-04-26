import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CotisationService } from '../../services/cotisation.service';
import { MemberService } from '../../services/member.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    private cotisationService = inject(CotisationService);
    private memberService = inject(MemberService);

    // Categories inspired by the dashboard reference
    categories = [
        { id: 'all', nom: "Vue d'Ensemble", montant: null },
        { id: 'simples', nom: 'Membres Simples', montant: '1000' },
        { id: 'honneur', nom: "Membres d'Honneur", montant: '5000' },
        // { id: 'compta', nom: 'Comptabilité & Finances', montant: 'compta' } // Commenté à la demande
    ];

    activeTab = signal('all');

    cotisations = this.memberService.getAllCotisations();
    members = this.memberService.getMembers();

    // Dynamically calculate stats based on active tab
    filteredStats = computed(() => {
        const tabId = this.activeTab();
        const activeCat = this.categories.find(c => c.id === tabId);
        
        let targetMembers = this.members();
        let targetCotis = this.cotisations();

        if (activeCat && activeCat.montant && activeCat.id !== 'all') {
            targetMembers = targetMembers.filter(m => m.categorie === activeCat.montant);
            const memberIds = new Set(targetMembers.map(m => m.id));
            targetCotis = targetCotis.filter(c => memberIds.has(c.membreId));
        }

        let totalRecu = 0;
        let totalAttendu = 0;
        let arrieres = 0;
        let avances = 0;

        targetMembers.forEach(m => {
            totalAttendu += parseInt(m.categorie) || 0;
        });

        targetCotis.forEach(c => {
            totalRecu += c.montantVerse;
            const m = this.memberService.getMemberById(c.membreId);
            const catVal = m ? parseInt(m.categorie) || 0 : 0;
            
            if (c.status === 'Rappel') arrieres += (catVal - c.montantVerse);
            if (c.status === 'Avance') avances += (c.montantVerse - catVal);
        });

        const percent = totalAttendu > 0 ? (totalRecu / totalAttendu) * 100 : 0;

        return {
            totalRecu,
            totalAttendu,
            arrieres,
            avances,
            tauxRecouvrement: Math.min(Math.round(percent), 100)
        };
    });

    filteredRecentPayments = computed(() => {
        const tabId = this.activeTab();
        const activeCat = this.categories.find(c => c.id === tabId);
        let targetCotis = this.cotisations();

        if (activeCat && activeCat.montant && activeCat.id !== 'all') {
            const targetMembers = this.members().filter(m => m.categorie === activeCat.montant);
            const memberIds = new Set(targetMembers.map(m => m.id));
            targetCotis = targetCotis.filter(c => memberIds.has(c.membreId));
        }

        return targetCotis.map(c => {
            const m = this.memberService.getMemberById(c.membreId);
            return { ...c, memberName: m ? `${m.prenom} ${m.nom}` : 'Inconnu' };
        }).sort((a, b) => b.id - a.id).slice(0, 5);
    });

    ngOnInit(): void { }

    formatMontant(v: number) {
        return this.memberService.formatMontant(v);
    }
}
