import { Injectable, signal, computed, inject } from '@angular/core';
import { Member, Cotisation, CategorieCotisation, StatutCotisation } from '../models/cotisation.model';
import { MemberService } from './member.service';

@Injectable({
    providedIn: 'root'
})
export class CotisationService {
    private memberService = inject(MemberService);

    members = this.memberService.getMembers();
    allCotisations = this.memberService.getAllCotisations();

    stats = computed(() => {
        const allMembers = this.members();
        const cotis = this.allCotisations();

        let totalRecu = 0;
        let totalAttendu = 0;
        let arrieres = 0;
        let avances = 0;

        allMembers.forEach(m => {
            totalAttendu += parseInt(m.categorie);
        });

        cotis.forEach(c => {
            totalRecu += c.montantVerse;
            if (c.status === 'Rappel') arrieres += (parseInt(this.memberService.getMemberById(c.membreId)?.categorie || '0') - c.montantVerse); // Simplified logic
            if (c.status === 'Avance') avances += (c.montantVerse - parseInt(this.memberService.getMemberById(c.membreId)?.categorie || '0'));
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

    getStats() {
        return this.stats;
    }
}
